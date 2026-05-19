"""Demo account seeder for hackathon jury evaluation.

Creates a pre-configured demo user with completed onboarding.
Transaction list is EMPTY — jury enters their own data to test the system.

Also preserves backward-compat `seed_if_empty` used by main.py lifespan.
"""
from __future__ import annotations

import logging
from datetime import date

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.models import FixedExpense, Goal, Product, User

log = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_EMAIL = "demo@mindfulspend.ai"
DEMO_PASSWORD = "Demo2026!"
DEMO_NAME = "Demo Kullanici"


def seed_demo_account(db: Session) -> None:
    """Create demo account if it doesn't exist. Idempotent."""
    existing = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if existing:
        log.info("Demo account already exists — skipping.")
        return

    # Create demo user with completed onboarding
    demo_user = User(
        email=DEMO_EMAIL,
        hashed_password=pwd_context.hash(DEMO_PASSWORD),
        full_name=DEMO_NAME,
        monthly_income=50_000.0,
        monthly_salary=50_000.0,
        budget_goal=35_000.0,
        onboarding_completed=True,
        risk_profile="moderate",
        financial_scenario="normal",
    )
    db.add(demo_user)
    db.flush()  # Get user ID

    # Fixed expenses (realistic Turkish household)
    fixed_expenses = [
        FixedExpense(user_id=demo_user.id, name="Kira", amount=15000, category="housing", due_day=1),
        FixedExpense(user_id=demo_user.id, name="Elektrik", amount=850, category="utilities", due_day=15),
        FixedExpense(user_id=demo_user.id, name="Dogalgaz", amount=600, category="utilities", due_day=15),
        FixedExpense(user_id=demo_user.id, name="Su", amount=250, category="utilities", due_day=10),
        FixedExpense(user_id=demo_user.id, name="Internet", amount=350, category="utilities", due_day=20),
        FixedExpense(user_id=demo_user.id, name="Cep Telefonu", amount=200, category="utilities", due_day=25),
        FixedExpense(user_id=demo_user.id, name="Netflix", amount=289.99, category="subscription", due_day=5),
        FixedExpense(user_id=demo_user.id, name="Spotify", amount=99.99, category="subscription", due_day=12),
    ]
    db.add_all(fixed_expenses)

    # Goals (aspirational but realistic)
    goals = [
        Goal(
            user_id=demo_user.id,
            title="Acil Durum Fonu",
            target_amount=100000,
            current_amount=25000,
            target_date=date(2026, 12, 31),
            category="emergency",
            priority=1,
        ),
        Goal(
            user_id=demo_user.id,
            title="Yaz Tatili",
            target_amount=40000,
            current_amount=8000,
            target_date=date(2026, 8, 15),
            category="vacation",
            priority=2,
        ),
    ]
    db.add_all(goals)

    db.commit()
    log.info("Demo account created: %s / %s", DEMO_EMAIL, DEMO_PASSWORD)


def seed_product_catalog(db: Session) -> None:
    """Seed the Virtual Market with a realistic Turkish product catalog from Excel.
    Idempotent: skips entirely if any products already exist.
    """
    if db.query(Product).count() > 0:
        return

    import pandas as pd
    import os

    excel_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "data",
            "01_raw",
            "product_catalog_updated_2026.xlsx"
        )
    )

    if not os.path.exists(excel_path):
        log.error("Product catalog Excel file not found: %s", excel_path)
        return

    log.info("Loading product catalog from Excel: %s", excel_path)
    df = pd.read_excel(excel_path)

    def map_excel_category(val: str) -> tuple[str, str]:
        val_upper = str(val).upper().strip()
        if "KOZMET" in val_upper:
            return "kisisel_bakim", "kozmetik"
        elif "DETERJAN" in val_upper or "TEM" in val_upper:
            return "temizlik", "ev_temizlik"
        elif "KAGIT" in val_upper or "KA" in val_upper and "IT" in val_upper:
            return "temizlik", "ev_temizlik"
        elif "GIDA" in val_upper:
            return "market_temel_ihtiyac", "genel_gida"
        elif "PET" in val_upper:
            return "diger", "evcil_hayvan"
        elif "TAVUK" in val_upper or "ET" in val_upper:
            return "market_temel_ihtiyac", "et_balik"
        elif "KAHVALTILIK" in val_upper or "SUT" in val_upper or "S\ufffdT" in val_upper or "SÜT" in val_upper:
            return "market_temel_ihtiyac", "sut_urunleri"
        elif "MEYVE" in val_upper or "SEBZE" in val_upper:
            return "market_temel_ihtiyac", "meyve_sebze"
        elif "BEBEK" in val_upper:
            return "market_temel_ihtiyac", "bebek"
        elif "ECEK" in val_upper or "ICECEK" in val_upper or "\ufffdECEK" in val_upper or "İÇECEK" in val_upper:
            return "market_atistirmalik", "icecek"
        elif "SIGARA" in val_upper or "S\ufffdGARA" in val_upper or "SİGARA" in val_upper:
            return "sigara", "sigara"
        elif "EV" in val_upper:
            return "diger", "ev_gerecleri"
        else:
            return "diger", "diger"

    products_to_add = []
    for _, row in df.iterrows():
        cat, sub_cat = map_excel_category(row['CATEGORY_NAME1'])
        name = str(row['ITEMNAME'])
        unit = "kg" if any(k in name.lower() for k in [" kg", " gr", "gram", "kilo"]) else "adet"
        
        necessity = str(row['necessity_final']).strip().lower()
        is_essential = (necessity == 'temel_ihtiyac')
        
        p = Product(
            name=name,
            category=cat,
            sub_category=sub_cat,
            price=float(row['PRICE_2026']),
            unit=unit,
            is_essential=is_essential,
            is_active=True,
            stock=100,
            image_url=None
        )
        products_to_add.append(p)

    db.add_all(products_to_add)
    db.commit()
    log.info("Product catalog seeded: %d items loaded from Excel", len(products_to_add))


def seed_if_empty() -> None:
    """Backward-compat wrapper called from main.py lifespan."""
    from app.db.database import SessionLocal

    db: Session = SessionLocal()
    try:
        seed_demo_account(db)
        seed_product_catalog(db)
    finally:
        db.close()
