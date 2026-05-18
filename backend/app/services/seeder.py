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
    """Seed the Virtual Market with a realistic Turkish product catalog.
    Idempotent: skips entirely if any products already exist.
    """
    if db.query(Product).count() > 0:
        return

    products: list[dict] = [
        # ── MEYVE/SEBZE (Essential) ──────────────────────────────
        {"name": "Domates", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 22.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80"},
        {"name": "Salatalık", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 18.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80"},
        {"name": "Patates", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 15.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1518977673343-a4a6211c4e74?w=400&q=80"},
        {"name": "Soğan", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 14.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80"},
        {"name": "Elma", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 25.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=400&q=80"},
        {"name": "Muz", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 45.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=400&q=80"},
        {"name": "Portakal", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 20.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400&q=80"},
        {"name": "Biber", "category": "market_temel_ihtiyac", "sub_category": "meyve_sebze", "price": 28.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400&q=80"},
        
        # ── SÜT ÜRÜNLERİ (Essential) ─────────────────────────────
        {"name": "Süt (1L)", "category": "market_temel_ihtiyac", "sub_category": "sut_urunleri", "price": 32.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"},
        {"name": "Yoğurt (1kg)", "category": "market_temel_ihtiyac", "sub_category": "sut_urunleri", "price": 65.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1573212004526-9d33261a86b3?w=400&q=80"},
        {"name": "Beyaz Peynir", "category": "market_temel_ihtiyac", "sub_category": "sut_urunleri", "price": 180.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80"},
        {"name": "Tereyağı (250g)", "category": "market_temel_ihtiyac", "sub_category": "sut_urunleri", "price": 145.0, "unit": "paket", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80"},
        {"name": "Kaşar Peyniri", "category": "market_temel_ihtiyac", "sub_category": "sut_urunleri", "price": 320.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1628190772240-a19bb44d2d46?w=400&q=80"},
        
        # ── TEMEL GIDA (Essential) ───────────────────────────────
        {"name": "Ekmek", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 12.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"},
        {"name": "Pirinç (1kg)", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 75.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80"},
        {"name": "Makarna (500g)", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 28.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&q=80"},
        {"name": "Bulgur (1kg)", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 55.0, "unit": "adet", "is_essential": True, "image_url": "https://plus.unsplash.com/premium_photo-1667050302316-dfa74e5bd81b?w=400&q=80"},
        {"name": "Un (2kg)", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 60.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1627485937980-221c88ce04ea?w=400&q=80"},
        
        # ── ET/BALIK (Essential) ─────────────────────────────────
        {"name": "Tavuk Göğüs", "category": "market_temel_ihtiyac", "sub_category": "et_balik", "price": 180.0, "unit": "kg", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1604544607736-22441ea6db20?w=400&q=80"},
        {"name": "Dana Kıyma (500g)", "category": "market_temel_ihtiyac", "sub_category": "et_balik", "price": 320.0, "unit": "paket", "is_essential": True, "image_url": "https://plus.unsplash.com/premium_photo-1678125482312-32a24ec9afbf?w=400&q=80"},
        {"name": "Yumurta (15'li)", "category": "market_temel_ihtiyac", "sub_category": "yumurta", "price": 95.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=400&q=80"},
        
        # ── BAKLAGİL (Essential) ─────────────────────────────────
        {"name": "Kırmızı Mercimek (1kg)", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 70.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&q=80"},
        {"name": "Nohut (1kg)", "category": "market_temel_ihtiyac", "sub_category": "ekmek_tahil", "price": 80.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400&q=80"},

        # ── TEMİZLİK & KİŞİSEL BAKIM ─────────────────────────────
        {"name": "Çamaşır Deterjanı", "category": "temizlik", "sub_category": "camasir", "price": 285.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1583947581924-860bda6a5c1f?w=400&q=80"},
        {"name": "Bulaşık Deterjanı (1L)", "category": "temizlik", "sub_category": "bulasik", "price": 65.0, "unit": "adet", "is_essential": True, "image_url": "https://plus.unsplash.com/premium_photo-1677610051786-fb14c5025a4a?w=400&q=80"},
        {"name": "Tuvalet Kağıdı (24'lü)", "category": "temizlik", "sub_category": "ev_temizlik", "price": 195.0, "unit": "paket", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&q=80"},
        {"name": "Şampuan (500ml)", "category": "kisisel_bakim", "sub_category": "hijyen", "price": 110.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80"},
        {"name": "Diş Macunu", "category": "kisisel_bakim", "sub_category": "hijyen", "price": 55.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1559591937-bea9d8b1bfb9?w=400&q=80"},
        {"name": "Duş Jeli (500ml)", "category": "kisisel_bakim", "sub_category": "hijyen", "price": 85.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80"},
        
        # ── ATIŞTIRMALIK (Discretionary) ─────────────────────────
        {"name": "Belçika Çikolatası", "category": "market_atistirmalik", "sub_category": "cikolata_seker", "price": 125.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&q=80"},
        {"name": "Lüks Kuruyemiş", "category": "market_atistirmalik", "sub_category": "cips_kraker", "price": 350.0, "unit": "kg", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1599598425947-330026e69123?w=400&q=80"},
        {"name": "Cips (150g)", "category": "market_atistirmalik", "sub_category": "cips_kraker", "price": 35.0, "unit": "paket", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1566478989037-e924e1e1f143?w=400&q=80"},
        {"name": "Kola (1L)", "category": "market_atistirmalik", "sub_category": "icecek", "price": 38.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80"},
        {"name": "Enerji İçeceği", "category": "market_atistirmalik", "sub_category": "icecek", "price": 42.0, "unit": "adet", "is_essential": False, "image_url": "https://plus.unsplash.com/premium_photo-1668471131649-65d1d6193796?w=400&q=80"},
        
        # ── LÜKS KOZMETİK ────────────────────────────────────────
        {"name": "Lüks Şampuan (400ml)", "category": "kisisel_bakim", "sub_category": "kozmetik", "price": 380.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&q=80"},
        {"name": "Parfüm (50ml)", "category": "kisisel_bakim", "sub_category": "kozmetik", "price": 1450.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&q=80"},
        {"name": "Cilt Bakım Kremi", "category": "kisisel_bakim", "sub_category": "kozmetik", "price": 520.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&q=80"},
        
        # ── TEKNOLOJİ ────────────────────────────────────────────
        {"name": "Kablosuz Kulaklık", "category": "eglence", "sub_category": "oyun", "price": 1899.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80"},
        {"name": "Akıllı Saat", "category": "eglence", "sub_category": "oyun", "price": 3499.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400&q=80"},
        {"name": "Bluetooth Hoparlör", "category": "eglence", "sub_category": "oyun", "price": 1299.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80"},

        # ── EĞLENCE ──────────────────────────────────────────────
        {"name": "Kitap (Roman)", "category": "egitim", "sub_category": "kitap", "price": 145.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80"},
        {"name": "Dergi", "category": "egitim", "sub_category": "kitap", "price": 65.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1582215893096-7bb6b6ecaf9b?w=400&q=80"},
        
        # ── EĞİTİM / KIRTASİYE (Discretionary) ───────────────────
        {"name": "Premium Dolma Kalem", "category": "egitim", "sub_category": "kirtasiye", "price": 1250.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1583485088034-607b3dd33ce3?w=400&q=80"},
        {"name": "Deri Kapaklı Defter", "category": "egitim", "sub_category": "kirtasiye", "price": 450.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1531346878377-a541e4ab0ad1?w=400&q=80"},
        {"name": "Termos Suluk", "category": "egitim", "sub_category": "kirtasiye", "price": 850.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&q=80"},
        
        # ── TÜTÜN & ALKOL (Discretionary) ────────────────────────
        {"name": "Malt Viski", "category": "sigara", "sub_category": "alkol", "price": 1850.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1563223771-5fe4f590a3c2?w=400&q=80"},
        {"name": "İthal Puro (Adet)", "category": "sigara", "sub_category": "sigara", "price": 450.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1583626354673-90d56bda165b?w=400&q=80"},
        {"name": "İthal Bira (6'lı)", "category": "sigara", "sub_category": "alkol", "price": 420.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1614316279930-cb6881907409?w=400&q=80"},
    ]

    for p_data in products:
        db.add(Product(**p_data))
    db.commit()
    log.info("Product catalog seeded: %d items with images", len(products))


def seed_if_empty() -> None:
    """Backward-compat wrapper called from main.py lifespan."""
    from app.db.database import SessionLocal

    db: Session = SessionLocal()
    try:
        seed_demo_account(db)
        seed_product_catalog(db)
    finally:
        db.close()
