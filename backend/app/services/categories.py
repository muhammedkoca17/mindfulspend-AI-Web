"""Hierarchical category system for MindfulSpend AI.

Auto-categorizes user grocery items (elma -> meyve_sebze -> market_temel_ihtiyac).

Sources:
- Turkish Market Sales Dataset (Kaggle: omercolakoglu) -> PRODUCT_CATEGORY_MAP
- Manual expert mapping -> CATEGORY_HIERARCHY
- MCC codes (Papel.com.tr / ISO 18245) -> MCC_MAP
"""
from __future__ import annotations

import json
import os

# ---------------------------------------------------------------------------
# Main category hierarchy
# ---------------------------------------------------------------------------
CATEGORY_HIERARCHY: dict[str, dict] = {
    "market_temel_ihtiyac": {
        "label": "Market - Temel Ihtiyac",
        "icon": "🥬",
        "is_essential": True,
        "sub_categories": {
            "meyve_sebze": [
                "elma", "muz", "portakal", "domates", "salatalik", "patates",
                "sogan", "biber", "havuc", "pirasa", "ispanak", "marul",
                "limon", "mandalina", "nar", "uzum", "cilek", "karpuz",
                "kavun", "armut", "seftali", "kayisi", "erik", "visne",
                "kabak", "patlican", "fasulye", "bezelye", "brokoli",
                "karnabahar", "lahana", "turp", "kere", "dereotu",
                "maydanoz", "nane", "roka",
            ],
            "sut_urunleri": [
                "sut", "yogurt", "peynir", "tereyagi", "kaymak", "ayran",
                "kefir", "lor", "tulum", "kasar",
            ],
            "ekmek_tahil": [
                "ekmek", "pirinc", "makarna", "bulgur", "un", "nohut",
                "mercimek", "fasulye", "barbunya", "irmik",
            ],
            "et_balik": [
                "tavuk", "dana kiyma", "kuzu", "balik", "kofte", "sucuk",
                "salam", "sosis", "pastirma", "fume",
            ],
            "yumurta": ["yumurta"],
            "yag": ["zeytinyagi", "aycicek yagi", "sivi yag", "margarin"],
        },
    },
    "market_atistirmalik": {
        "label": "Market - Atistirmalik",
        "icon": "🍫",
        "is_essential": False,
        "sub_categories": {
            "cikolata_seker": [
                "cikolata", "seker", "lokum", "helva", "gofret", "dondurma",
                "bonbon", "draje",
            ],
            "cips_kraker": ["cips", "kraker", "biskuvi", "kek", "pasta", "kurabiye"],
            "icecek": [
                "kola", "gazoz", "meyve suyu", "enerji icecegi", "soda",
                "ice tea", "limonata",
            ],
        },
    },
    "temizlik": {
        "label": "Temizlik Malzemeleri",
        "icon": "🧴",
        "is_essential": True,
        "sub_categories": {
            "camasir": ["deterjan", "yumusatici", "camasir suyu", "leke cikarici"],
            "bulasik": ["bulasik deterjani", "bulasik tableti"],
            "ev_temizlik": [
                "yuzey temizleyici", "cam sil", "cop poseti", "tuvalet kagidi",
                "kagit havlu", "pecete",
            ],
        },
    },
    "kisisel_bakim": {
        "label": "Kisisel Bakim",
        "icon": "🧼",
        "is_essential": True,
        "sub_categories": {
            "hijyen": ["sampuan", "dus jeli", "dis macunu", "sabun", "deodorant"],
            "kozmetik": ["krem", "makyaj", "parfum", "oje"],
        },
    },
    "yemek_disari": {
        "label": "Disarida Yemek",
        "icon": "🍽️",
        "is_essential": False,
        "sub_categories": {
            "restoran": ["restoran", "lokanta"],
            "fast_food": ["mcdonalds", "burger king", "dominos", "pizza"],
            "kafe": ["kahve", "starbucks", "cay"],
            "siparis": ["yemeksepeti", "getir yemek", "trendyol yemek"],
        },
    },
    "eglence": {
        "label": "Eglence",
        "icon": "🎭",
        "is_essential": False,
        "sub_categories": {
            "sinema_tiyatro": ["sinema", "tiyatro", "konser"],
            "gece_hayati": ["bar", "kulup", "alkol", "bira", "raki", "sarap"],
            "oyun": ["steam", "playstation", "xbox", "mobil oyun"],
        },
    },
    "saglik": {
        "label": "Saglik",
        "icon": "💊",
        "is_essential": True,
        "sub_categories": {
            "ilac": ["eczane", "vitamin", "ilac"],
            "doktor": ["muayene", "tahlil", "dis hekimi", "goz doktoru"],
            "spor": ["spor salonu", "pilates", "yuzme"],
        },
    },
    "giyim": {
        "label": "Giyim",
        "icon": "👕",
        "is_essential": False,
        "sub_categories": {
            "temel_giyim": ["ic camasiri", "corap", "tisort", "pantolon"],
            "dis_giyim": ["mont", "ceket", "kazak", "elbise"],
            "ayakkabi": ["ayakkabi", "bot", "terlik", "spor ayakkabi"],
        },
    },
    "egitim": {
        "label": "Egitim",
        "icon": "📚",
        "is_essential": True,
        "sub_categories": {
            "kitap": ["kitap", "dergi", "e-kitap"],
            "kurs": ["online kurs", "udemy", "coursera", "dil kursu"],
            "okul": ["okul taksidi", "kirtasiye", "defter", "kalem"],
        },
    },
    "sigara": {
        "label": "Sigara & Tutun",
        "icon": "🚬",
        "is_essential": False,
        "sub_categories": {
            "sigara": ["sigara", "tutun", "puro"],
        },
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
    "5411": {"category": "market_temel_ihtiyac", "label": "Supermarket / Gida"},
    "5812": {"category": "yemek_disari", "label": "Restoran"},
    "5814": {"category": "yemek_disari", "label": "Fast Food"},
    "5912": {"category": "saglik", "label": "Eczane"},
    "5691": {"category": "giyim", "label": "Giyim Magazasi"},
    "5732": {"category": "diger", "label": "Elektronik"},
    "5977": {"category": "kisisel_bakim", "label": "Kozmetik"},
    "5983": {"category": "ulasim", "label": "Akaryakit"},
    "4121": {"category": "ulasim", "label": "Taksi"},
    "4814": {"category": "fatura", "label": "Telekomunikasyon"},
    "4900": {"category": "fatura", "label": "Kamu Hizmetleri"},
    "7832": {"category": "eglence", "label": "Sinema"},
    "8062": {"category": "saglik", "label": "Hastane"},
    "5712": {"category": "diger", "label": "Mobilya"},
    "6011": {"category": "diger", "label": "ATM"},
}

# Discretionary (impulse-risk high) categories
DISCRETIONARY_CATEGORIES: set[str] = {
    "market_atistirmalik",
    "eglence",
    "yemek_disari",
    "giyim",
    "abonelik",
    "sigara",
}

# ---------------------------------------------------------------------------
# Turkish Market Sales dataset product->category lookup (lazy-loaded)
# ---------------------------------------------------------------------------
_PRODUCT_MAP: dict[str, str] = {}


def _load_product_map() -> None:
    """Lazy-load the product-category map extracted from market_sales.xlsx."""
    global _PRODUCT_MAP
    if _PRODUCT_MAP:
        return
    map_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "data", "01_raw", "lookups", "product_category_map.json"
    )
    if os.path.exists(map_path):
        with open(map_path, encoding="utf-8") as f:
            _PRODUCT_MAP = json.load(f)


# ---------------------------------------------------------------------------
# Turkish chars normalization for matching
# ---------------------------------------------------------------------------
_TR_CHAR_MAP = str.maketrans(
    "cCgGiIoOsSuU",
    "cCgGiIoOsSuU",
)


def _normalize_turkish(text: str) -> str:
    """Lowercase and simplify Turkish special chars for matching."""
    return text.lower().strip()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def detect_category(item_name: str) -> tuple[str, str, bool]:
    """Auto-detect category and sub_category from item name.

    Returns (main_category, sub_category, is_essential).
    Falls back to ("diger", "diger", False) if not found.

    Strategy:
    1. Exact/partial match in CATEGORY_HIERARCHY sub_category items
    2. Lookup in Turkish Market Sales product map
    3. Fallback to "diger"
    """
    item_lower = _normalize_turkish(item_name)

    # 1. Direct match against hierarchy keywords
    for main_cat, data in CATEGORY_HIERARCHY.items():
        for sub_cat, items in data["sub_categories"].items():
            for keyword in items:
                if keyword in item_lower or item_lower in keyword:
                    return main_cat, sub_cat, data.get("is_essential", False)

    # 2. Lookup in Turkish Market Sales product map
    _load_product_map()
    if _PRODUCT_MAP:
        for product_name, dataset_cat in _PRODUCT_MAP.items():
            if item_lower in product_name.lower() or product_name.lower() in item_lower:
                # Map dataset category to our hierarchy
                mapped = _map_dataset_category(dataset_cat)
                if mapped:
                    return mapped

    return "diger", "diger", False


def _map_dataset_category(dataset_cat: str) -> tuple[str, str, bool] | None:
    """Map a Turkish Market Sales CATEGORY_NAME1 to our hierarchy."""
    cat_lower = dataset_cat.lower().strip()
    mapping = {
        "gida": ("market_temel_ihtiyac", "genel_gida", True),
        "meyve sebze": ("market_temel_ihtiyac", "meyve_sebze", True),
        "sut kahvaltilik": ("market_temel_ihtiyac", "sut_urunleri", True),
        "et tavuk": ("market_temel_ihtiyac", "et_balik", True),
        "icecek": ("market_atistirmalik", "icecek", False),
        "deterjan temizlik": ("temizlik", "ev_temizlik", True),
        "kagit": ("temizlik", "ev_temizlik", True),
        "kozmetik": ("kisisel_bakim", "kozmetik", True),
        "ev": ("diger", "ev_esyasi", False),
        "bebek": ("market_temel_ihtiyac", "bebek", True),
        "sigara": ("sigara", "sigara", False),
        "pet": ("diger", "evcil_hayvan", False),
    }
    return mapping.get(cat_lower)


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
