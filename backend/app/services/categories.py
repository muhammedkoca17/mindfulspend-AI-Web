"""Hierarchical category system for MindfulSpend AI.

Auto-categorizes user grocery items (elma -> meyve_sebze -> market_temel_ihtiyac).

Sources:
- Turkish Market Sales Dataset (Kaggle: omercolakoglu) -> PRODUCT_CATEGORY_MAP
- Manual expert mapping -> CATEGORY_HIERARCHY
- MCC codes (Papel.com.tr / ISO 18245) -> MCC_MAP
"""
from __future__ import annotations

from sqlalchemy.orm import Session

# ---------------------------------------------------------------------------
# Main category hierarchy
# ---------------------------------------------------------------------------
CATEGORY_HIERARCHY: dict[str, dict] = {
    "GIDA": {
        "label": "Gıda & Temel Gıda",
        "icon": "🍞",
        "is_essential": True,
        "sub_categories": {}
    },
    "MEYVE SEBZE": {
        "label": "Meyve & Sebze",
        "icon": "🥬",
        "is_essential": True,
        "sub_categories": {}
    },
    "SÜT KAHVALTILIK": {
        "label": "Süt & Kahvaltılık",
        "icon": "🧀",
        "is_essential": True,
        "sub_categories": {}
    },
    "ET TAVUK": {
        "label": "Et & Tavuk",
        "icon": "🍗",
        "is_essential": True,
        "sub_categories": {}
    },
    "BEBEK": {
        "label": "Bebek Ürünleri",
        "icon": "👶",
        "is_essential": True,
        "sub_categories": {}
    },
    "DETERJAN TEMİZLİK": {
        "label": "Deterjan & Temizlik",
        "icon": "🧼",
        "is_essential": True,
        "sub_categories": {}
    },
    "KAĞIT": {
        "label": "Kağıt Ürünleri",
        "icon": "🧻",
        "is_essential": True,
        "sub_categories": {}
    },
    "KOZMETİK": {
        "label": "Kozmetik & Kişisel Bakım",
        "icon": "💄",
        "is_essential": False,
        "sub_categories": {}
    },
    "İÇECEK": {
        "label": "İçecekler",
        "icon": "🥤",
        "is_essential": False,
        "sub_categories": {}
    },
    "SİGARA": {
        "label": "Sigara & Tütün",
        "icon": "🚬",
        "is_essential": False,
        "sub_categories": {}
    },
    "EV": {
        "label": "Ev Gereçleri & Yaşam",
        "icon": "🏠",
        "is_essential": False,
        "sub_categories": {}
    },
    "PET": {
        "label": "Evcil Hayvan (Pet)",
        "icon": "🐱",
        "is_essential": False,
        "sub_categories": {}
    },
}

# Subscription price table (rule engine)
# Source: Tamindir, Herm.io, Kepyo (Jan-May 2026)
SUBSCRIPTION_PRICES_TRY: dict[str, float] = {
    "netflix_temel": 189.99,
    "netflix_standart": 289.99,
    "netflix_premium": 379.99,
    "spotify_bireysel": 99.99,
    "spotify_ogrenci": 52.99,
    "spotify_aile": 179.99,
    "disney_reklamli": 249.90,
    "disney_reklamsiz": 449.90,
    "youtube_premium": 77.99,
    "youtube_premium_aile": 159.99,
    "blutv": 109.90,
    "exxen": 149.90,
    "gain": 99.90,
}

# MCC code dictionary (Papel.com.tr + ISO 18245)
CATEGORIES_MCC_MAP: dict[str, dict] = {
    "5411": {"category": "GIDA", "label": "Supermarket / Gida"},
    "5812": {"category": "yemek_disari", "label": "Restoran"},
    "5814": {"category": "yemek_disari", "label": "Fast Food"},
    "5912": {"category": "saglik", "label": "Eczane"},
    "5691": {"category": "giyim", "label": "Giyim Magazasi"},
    "5732": {"category": "EV", "label": "Elektronik"},
    "5977": {"category": "KOZMETİK", "label": "Kozmetik"},
    "5983": {"category": "ulasim", "label": "Akaryakit"},
    "4121": {"category": "ulasim", "label": "Taksi"},
    "4814": {"category": "fatura", "label": "Telekomunikasyon"},
    "4900": {"category": "fatura", "label": "Kamu Hizmetleri"},
    "7832": {"category": "eglence", "label": "Sinema"},
    "8062": {"category": "saglik", "label": "Hastane"},
    "5712": {"category": "EV", "label": "Mobilya"},
    "6011": {"category": "EV", "label": "ATM"},
}

# Discretionary (impulse-risk high) categories
DISCRETIONARY_CATEGORIES: set[str] = {
    "İÇECEK",
    "SİGARA",
    "EV",
    "PET",
    "KOZMETİK",
}


def _normalize_turkish(text: str) -> str:
    """Lowercase and simplify Turkish special chars for matching."""
    return text.lower().strip()


def detect_category(item_name: str, db: Session | None = None) -> tuple[str, str, bool]:
    """Auto-detect category and sub_category from item name.

    Returns (main_category, sub_category, is_essential).
    Falls back to ("EV", "diger", False) if not found.
    """
    from app.db.models import Product
    item_lower = _normalize_turkish(item_name)

    # 1. DB Lookup if available
    if db:
        prod = db.query(Product).filter(Product.name.ilike(f"%{item_name}%")).first()
        if prod:
            return prod.category, prod.sub_category or "diger", prod.is_essential

    # 2. Fallback keyword mapping
    keywords_mapping = {
        "GIDA": ["ekmek", "pirinc", "makarna", "bulgur", "un", "nohut", "mercimek", "fasulye", "seker", "salca", "gida", "cikolata", "biskuvi", "cips", "kraker", "kek"],
        "MEYVE SEBZE": ["elma", "muz", "portakal", "domates", "salatalik", "patates", "sogan", "biber", "havuc", "meyve", "sebze", "limon"],
        "SÜT KAHVALTILIK": ["sut", "yogurt", "peynir", "tereyagi", "kaymak", "ayran", "kefir", "lor", "kasar", "zeytin", "yumurta", "bal", "recel"],
        "ET TAVUK": ["tavuk", "kiyma", "et", "kuzu", "balik", "sucuk", "salam", "sosis", "pastirma"],
        "BEBEK": ["bebek", "mama", "bez", "islak mendil"],
        "DETERJAN TEMİZLİK": ["deterjan", "yumusatici", "camasir suyu", "bulasik", "temizleyici", "sabun", "sampuan"],
        "KAĞIT": ["pecete", "tuvalet kagidi", "kagit havlu"],
        "KOZMETİK": ["krem", "makyaj", "parfum", "oje", "ruj", "maskara", "kozmetik"],
        "İÇECEK": ["kola", "gazoz", "su", "soda", "icecek", "cay", "kahve", "meyve suyu"],
        "SİGARA": ["sigara", "tutun", "puro"],
        "EV": ["mutfak", "bardak", "tabak", "tava", "lamba", "pil", "ampul", "ev"],
        "PET": ["pet", "kedi", "kopek", "mama", "kum"]
    }

    for cat, keywords in keywords_mapping.items():
        for kw in keywords:
            if kw in item_lower:
                is_ess = cat not in DISCRETIONARY_CATEGORIES
                return cat, "diger", is_ess

    return "EV", "diger", False


def is_discretionary(category: str) -> bool:
    """Check if a category is discretionary (impulse-risk)."""
    return category in DISCRETIONARY_CATEGORIES


def is_essential_product(category_key: str) -> bool:
    """Check if a product category is essential (basic need)."""
    return category_key not in DISCRETIONARY_CATEGORIES


def get_category_label(category: str) -> str:
    """Get Turkish display label for a category."""
    if category in CATEGORY_HIERARCHY:
        return CATEGORY_HIERARCHY[category]["label"]
    return "Diger"


def get_category_icon(category: str) -> str:
    """Get emoji icon for a category."""
    if category in CATEGORY_HIERARCHY:
        return CATEGORY_HIERARCHY[category]["icon"]
    return "📦"
