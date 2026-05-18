"""Domain constants — category taxonomy, RFM weights, segment thresholds.

Derived from real Kaggle data exploration (May 2026):
  - Personal Finance Tracker: 10 stable categories (Insurance, Utilities, Groceries…)
  - BudgetWise: 50+ noisy variants (Food/FOOD/food/Foods/Fod/Foodd) for ETL practice
  - Financial Transactions: high-granularity micro-categories (Cafe, Taxi, Public transport)
"""
from __future__ import annotations

# ---------------------------------------------------------------------------
# Canonical category taxonomy
# ---------------------------------------------------------------------------
# Maps a normalized canonical name → (display_label_tr, spending_type, mcc_proxy)
CATEGORY_TAXONOMY: dict[str, tuple[str, str, str]] = {
    # === Essentials ===
    "groceries":       ("Market",          "essential",     "5411"),
    "food":            ("Market",          "essential",     "5411"),
    "rent":            ("Kira",            "essential",     "6513"),
    "utilities":       ("Faturalar",       "essential",     "4900"),
    "telecom":         ("Telekom",         "essential",     "4814"),
    "healthcare":      ("Sağlık",          "essential",     "8011"),
    "health":          ("Sağlık",          "essential",     "8011"),
    "transportation":  ("Ulaşım",          "essential",     "4111"),
    "public_transport":("Toplu Taşıma",    "essential",     "4111"),
    "taxi":            ("Taksi",           "essential",     "4121"),
    "insurance":       ("Sigorta",         "essential",     "6300"),
    "education":       ("Eğitim",          "essential",     "8220"),
    "university":      ("Eğitim",          "essential",     "8220"),

    # === Discretionary ===
    "dining_out":      ("Restoran",        "discretionary", "5812"),
    "cafe":            ("Kafe",            "discretionary", "5814"),
    "entertainment":   ("Eğlence",         "discretionary", "5813"),
    "leisure":         ("Eğlence",         "discretionary", "5813"),
    "clothes":         ("Giyim",           "discretionary", "5651"),
    "gifts":           ("Hediye",          "discretionary", "5947"),
    "travel":          ("Seyahat",         "discretionary", "4722"),
    "other":           ("Diğer",           "discretionary", "5999"),
    "shopping":        ("Alışveriş",       "discretionary", "5311"),

    # === Investment / Savings (treated as essential-positive) ===
    "investments":     ("Yatırım",         "essential",     "6211"),
    "savings":         ("Birikim",         "essential",     "6012"),

    # === Income (filtered out of expense models) ===
    "salary":          ("Maaş",            "income",        "0000"),
    "bonus":           ("Bonus",           "income",        "0000"),
    "freelance":       ("Serbest Çalışma", "income",        "0000"),
    "second_work":     ("Ek Gelir",        "income",        "0000"),
    "cashback":        ("Cashback",        "income",        "0000"),
    "deposit_interest":("Mevduat Faizi",   "income",        "0000"),
    "gift_received":   ("Hediye (Gelen)",  "income",        "0000"),

    # === Fines (negative essential) ===
    "fines":           ("Cezalar",         "essential",     "9399"),

    # === Generic catch-all ===
    "others":          ("Diğer",           "discretionary", "5999"),
}


def normalize_category(raw: str) -> str:
    """Map a possibly-misspelled, casing-chaotic raw category to a canonical key.

    Handles real-world dirt observed in BudgetWise:
        'FOOD', 'Food', 'food', 'Foods', 'Foodd', 'Fod', 'FFood', 'Foood' → 'food'
        'Rent', 'rent', 'RENT', 'Rentt', 'Rnt'                            → 'rent'
        'Public transport', 'public_transport'                            → 'public_transport'
    """
    if not isinstance(raw, str):
        return "others"

    s = raw.strip().lower()
    s = "".join(ch for ch in s if ch.isalnum() or ch in " _-")
    s = s.replace("-", " ").replace("_", " ").strip()

    # Exact match shortcut
    direct = s.replace(" ", "_")
    if direct in CATEGORY_TAXONOMY:
        return direct

    # Heuristic substring/typo collapse
    rules = [
        ("food",         {"food", "foood", "fooods", "fod", "foodd", "foods", "ffood", "groceries", "grocery"}),
        ("rent",         {"rent", "rentt", "rnt", "house rent"}),
        ("utilities",    {"utilities", "utility", "bills", "electricity", "water", "gas"}),
        ("dining_out",   {"dining out", "dining", "restaurant", "restoran"}),
        ("cafe",         {"cafe", "coffee", "starbucks"}),
        ("public_transport", {"public transport", "bus", "metro", "transit"}),
        ("transportation",   {"transportation", "transport", "transports"}),
        ("taxi",         {"taxi", "uber", "cab", "yandex taxi"}),
        ("healthcare",   {"healthcare", "health", "helth"}),
        ("entertainment",{"entertainment", "fun"}),
        ("leisure",      {"leisure"}),
        ("education",    {"education", "educaton", "edcation"}),
        ("university",   {"university"}),
        ("insurance",    {"insurance"}),
        ("investments",  {"investments", "investment"}),
        ("savings",      {"savings", "saving"}),
        ("salary",       {"salary", "salry", "job"}),
        ("bonus",        {"bonus"}),
        ("freelance",    {"freelance", "freelancer"}),
        ("second_work",  {"second work", "side hustle"}),
        ("cashback",     {"cashback", "cash back"}),
        ("deposit_interest", {"deposit interest", "interest"}),
        ("clothes",      {"clothes", "clothing"}),
        ("gifts",        {"gifts", "gift"}),
        ("gift_received",{"gift received"}),
        ("travel",       {"travel", "vacation", "trip"}),
        ("shopping",     {"shopping", "shop", "bought for myself"}),
        ("fines",        {"fines", "fine"}),
        ("telecom",      {"telecom", "phone", "mobile"}),
    ]
    for canonical, variants in rules:
        if s in variants or any(v in s for v in variants if len(v) > 3):
            return canonical
    return "others"


def category_to_spending_type(category: str) -> str:
    """Return essential | discretionary | income."""
    canonical = normalize_category(category) if category not in CATEGORY_TAXONOMY else category
    return CATEGORY_TAXONOMY.get(canonical, ("Diğer", "discretionary", "5999"))[1]


def category_to_mcc(category: str) -> str:
    canonical = normalize_category(category) if category not in CATEGORY_TAXONOMY else category
    return CATEGORY_TAXONOMY.get(canonical, ("Diğer", "discretionary", "5999"))[2]


def category_to_display(category: str) -> str:
    canonical = normalize_category(category) if category not in CATEGORY_TAXONOMY else category
    return CATEGORY_TAXONOMY.get(canonical, ("Diğer", "discretionary", "5999"))[0]


# Backwards-compat alias used elsewhere in the codebase
MCC_MAP = {info[2]: (info[0], info[1]) for info in CATEGORY_TAXONOMY.values()}


# ---------------------------------------------------------------------------
# RFM risk weights — Veri Analizi Raporu §4.2
# ---------------------------------------------------------------------------
RFM_WEIGHTS = {
    "R": 0.20,
    "F": 0.45,
    "M": 0.35,
}

SEGMENT_THRESHOLDS = [
    (2.00, "Sadık Tasarrufçu"),
    (3.50, "Risk Potansiyeli"),
    (5.01, "İmpulsif / Kırılgan"),
]

NUDGE_STRATEGIES = [
    "loss_aversion",
    "social_norms",
    "planning",
    "positive_reinforcement",
]


def segment_for_score(rfm_risk: float) -> str:
    for threshold, label in SEGMENT_THRESHOLDS:
        if rfm_risk < threshold:
            return label
    return SEGMENT_THRESHOLDS[-1][1]
