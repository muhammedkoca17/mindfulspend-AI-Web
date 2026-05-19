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

    def clean_turkish_string(val: str) -> str:
        if not isinstance(val, str) or pd.isna(val):
            return ""
        val = val.strip().upper().replace('\uFFFD', '?')
        
        mapping = {
            'KOZMET?K': 'KOZMETİK',
            'GIDA': 'GIDA',
            '?ECEK': 'İÇECEK',
            'EV': 'EV',
            'DETERJAN TEM?ZL?K': 'DETERJAN TEMİZLİK',
            'BEBEK': 'BEBEK',
            'ET TAVUK': 'ET TAVUK',
            'S?GARA': 'SİGARA',
            'S?T KAHVALTILIK': 'SÜT KAHVALTILIK',
            'KA?IT': 'KAĞIT',
            'MEYVE SEBZE': 'MEYVE SEBZE',
            'PET': 'PET'
        }
        return mapping.get(val, val)



    products_to_add = []
    for _, row in df.iterrows():
        raw_cat1 = str(row.get('CATEGORY_NAME1', ''))
        raw_cat2 = str(row.get('CATEGORY_NAME2', ''))
        raw_cat3 = str(row.get('CATEGORY_NAME3', ''))
        
        cat = clean_turkish_string(raw_cat1) or "EV"
        sub_cat = clean_turkish_string(raw_cat2) or "diger"
        
        name = str(row['ITEMNAME']).strip()
        unit = "kg" if any(k in name.lower() for k in [" kg", " gr", "gram", "kilo"]) else "adet"
        
        # Determine necessity: True for essential, False for discretionary
        final = str(row.get('necessity_final', '')).strip().lower()
        if not final or final in ['nan', 'emin_değil', 'emin_degil', 'null', 'none']:
            auto = str(row.get('necessity_auto', '')).strip().lower()
            if 'temel' in auto:
                is_essential = True
                necessity_val = 'temel_ihtiyac'
            else:
                is_essential = False
                necessity_val = 'tam_gerekli_deyil'
        else:
            if 'temel' in final:
                is_essential = True
                necessity_val = 'temel_ihtiyac'
            else:
                is_essential = False
                necessity_val = 'tam_gerekli_deyil'
        
        brand_val = row.get('BRAND', None)
        brand = str(brand_val).strip() if not pd.isna(brand_val) else None
        
        p = Product(
            item_code=int(row['ITEMCODE']) if not pd.isna(row['ITEMCODE']) else None,
            name=name,
            brand=brand,
            category=cat,
            sub_category=sub_cat,
            category_name1=cat,
            category_name2=clean_turkish_string(raw_cat2),
            category_name3=clean_turkish_string(raw_cat3),
            price=float(row['PRICE_2026']),
            unit=unit,
            is_essential=is_essential,
            total_sold=int(row['total_sold']) if not pd.isna(row['total_sold']) else 0,
            price_tier_global=str(row['price_tier_global_2026']) if not pd.isna(row['price_tier_global_2026']) else None,
            price_tier_category=str(row['price_tier_category_2026']) if not pd.isna(row['price_tier_category_2026']) else None,
            necessity_auto=str(row.get('necessity_auto', '')) if not pd.isna(row.get('necessity_auto', '')) else None,
            necessity_final=necessity_val,
            popularity=str(row.get('popularity', '')) if not pd.isna(row.get('popularity', '')) else None,
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
