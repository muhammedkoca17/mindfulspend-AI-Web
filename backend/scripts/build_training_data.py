"""
MindfulSpend AI - Step 1 & 2: EDA + Data Cleaning
"""
import json
import warnings
from pathlib import Path
import pandas as pd
import numpy as np

warnings.filterwarnings('ignore')
np.random.seed(42)

BASE = Path(__file__).resolve().parent.parent
RAW = BASE / "data" / "01_raw"
INTERIM = BASE / "data" / "02_interim"

INTERIM.mkdir(parents=True, exist_ok=True)

eda = []

def eda_file(name, df):
    eda.append(f"\n{'='*60}")
    eda.append(f"FILE: {name}")
    eda.append(f"Shape: {df.shape}")
    eda.append(f"Columns: {list(df.columns)}")
    eda.append(f"Dtypes:\n{df.dtypes.to_string()}")
    nulls = df.isnull().sum()
    nulls = nulls[nulls > 0]
    eda.append(f"Nulls: {nulls.to_dict() if len(nulls) > 0 else 'None'}")
    eda.append(f"First 3 rows:\n{df.head(3).to_string()}")
    eda.append(f"Last 3 rows:\n{df.tail(3).to_string()}")
    eda.append(f"{'='*60}")
    # Screen output: compact
    print(f"=== {name} ===")
    print(f"  Shape: {df.shape}")
    print(f"  Columns: {list(df.columns)}")
    nulld = nulls.to_dict() if len(nulls) > 0 else {}
    if nulld:
        print(f"  Nulls: {nulld}")
    print(f"  First 3 rows shown in EDA report")
    print()

# ----------------------------------------------------------------
# STEP 1: READ ALL DATASETS
# ----------------------------------------------------------------
print("=" * 60)
print("STEP 1: READING DATASETS")
print("=" * 60)

# 1) customer_shopping_data.csv
shopping = pd.read_csv(RAW / "customer_shopping_data.csv")
eda_file("customer_shopping_data.csv", shopping)

# 2) online_retail_II.csv
retail = pd.read_csv(RAW / "online_retail_II.csv", encoding='latin-1')
eda_file("online_retail_II.csv", retail)

# 3) product_catalog_updated_2026.xlsx
catalog = pd.read_excel(RAW / "product_catalog_updated_2026.xlsx", engine='openpyxl')
eda_file("product_catalog_updated_2026.xlsx", catalog)

# 4) cards_data.csv
cards = pd.read_csv(RAW / "cards_data.csv")
eda_file("cards_data.csv", cards)

# 5) users_data.csv
users = pd.read_csv(RAW / "users_data.csv")
eda_file("users_data.csv", users)

# 6) turkey_bin_list.json
bins_df = pd.json_normalize(json.load(open(RAW / "turkey_bin_list.json", encoding='utf-8')))
eda_file("turkey_bin_list.json", bins_df)

# 7-9) Lookups
for fname in ['mcc_codes.json', 'product_category_map.json', 'subscription_prices.json']:
    fpath = RAW / "lookups" / fname
    if fpath.exists():
        data = json.load(open(fpath, encoding='utf-8'))
        eda.append(f"\nFILE: lookups/{fname}")
        if isinstance(data, dict):
            eda.append(f"  Type: dict, Keys: {len(data)}, Sample: {list(data.keys())[:5]}")
        elif isinstance(data, list):
            eda.append(f"  Type: list, Length: {len(data)}")
        print(f"=== lookups/{fname} === Type={'dict' if isinstance(data, dict) else 'list'}, Entries={len(data)}")

# Save EDA
with open(INTERIM / "eda_report.txt", "w", encoding='utf-8') as f:
    f.write("\n".join(eda))
print(f"\n[EDA report saved: {INTERIM / 'eda_report.txt'}]")

# Load MCC lookup
mcc_data = json.load(open(RAW / "lookups" / "mcc_codes.json", encoding='utf-8'))

# ----------------------------------------------------------------
# STEP 2A: CLEAN customer_shopping_data.csv
# ----------------------------------------------------------------
print("\n" + "=" * 60)
print("STEP 2A: CLEANING SHOPPING DATA")
print("=" * 60)

shop = shopping.copy()
shop.columns = [c.strip().lower().replace(' ', '_') for c in shop.columns]
print(f"  Columns: {list(shop.columns)}")

# Parse date
shop['invoice_date'] = pd.to_datetime(shop['invoice_date'], dayfirst=True, errors='coerce')

# Time features
shop['hour'] = shop['category'].apply(lambda c: np.random.choice(
    [9,10,11,12,17,18,19] if 'food' in str(c).lower() or 'beverage' in str(c).lower()
    else [10,11,14,15,16,20,21,22] if str(c).lower() in ['clothing','technology']
    else [10,11,12,14,15,16]
))
shop['day_of_week'] = shop['invoice_date'].dt.dayofweek
shop['month'] = shop['invoice_date'].dt.month
shop['is_weekend'] = (shop['day_of_week'] >= 5).astype(int)

# Amount
shop['amount_try'] = shop['price'] * shop['quantity']

# Essential
shop['is_essential'] = shop['category'].str.lower().apply(
    lambda x: 1 if 'food' in x or 'beverage' in x else 0
)

# MCC code mapping (category → closest MCC)
category_mcc_map = {
    'clothing': '5651', 'shoes': '5661', 'technology': '5732',
    'cosmetics': '5977', 'food & beverages': '5411', 'toys': '5945',
    'souvenir': '5947', 'books': '5942'
}
shop['mcc_code'] = shop['category'].str.lower().map(category_mcc_map).fillna('5999')

# Select columns
keep = ['customer_id', 'invoice_no', 'invoice_date', 'hour', 'day_of_week',
        'is_weekend', 'category', 'quantity', 'price', 'amount_try',
        'payment_method', 'age', 'gender', 'shopping_mall', 'is_essential', 'mcc_code']
shop = shop[[c for c in keep if c in shop.columns]]

shop.to_csv(INTERIM / "shopping_clean.csv", index=False)
print(f"  Saved: shopping_clean.csv ({shop.shape[0]} rows, {shop.shape[1]} cols)")

# ----------------------------------------------------------------
# STEP 2B: CLEAN online_retail_II.csv
# ----------------------------------------------------------------
print("\n" + "=" * 60)
print("STEP 2B: CLEANING RETAIL DATA")
print("=" * 60)

ret = retail.copy()
print(f"  Original columns: {list(ret.columns)}")
print(f"  Original shape: {ret.shape}")

# Drop nulls and negatives
cust_col = 'Customer ID'
ret = ret.dropna(subset=[cust_col])
ret = ret[ret['Quantity'] > 0]
ret = ret[ret['Price'] > 0]

# Parse date
ret['InvoiceDate'] = pd.to_datetime(ret['InvoiceDate'], errors='coerce')
ret['hour'] = ret['InvoiceDate'].dt.hour
ret['day_of_week'] = ret['InvoiceDate'].dt.dayofweek
ret['is_weekend'] = (ret['day_of_week'] >= 5).astype(int)

# GBP → TRY
ret['price_gbp'] = ret['Price']
ret['Price'] = ret['Price'] * 40.0
ret['amount_try'] = ret['Price'] * ret['Quantity']

# Rename
ret = ret.rename(columns={cust_col: 'customer_id', 'Description': 'item_name'})
keep_ret = ['customer_id', 'InvoiceDate', 'hour', 'day_of_week', 'is_weekend',
            'item_name', 'Quantity', 'price_gbp', 'amount_try']
ret = ret[[c for c in keep_ret if c in ret.columns]]

ret.to_csv(INTERIM / "retail_clean.csv", index=False)
print(f"  Saved: retail_clean.csv ({ret.shape[0]} rows, {ret.shape[1]} cols)")

print(f"\nSTEP 2 DONE: shopping={shop.shape[0]}, retail={ret.shape[0]}")
