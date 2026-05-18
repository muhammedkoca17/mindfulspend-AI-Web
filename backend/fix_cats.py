import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.db.database import SessionLocal
from app.db.models import Product

db = SessionLocal()
try:
    # 1. DELETE UNWANTED CATEGORIES
    bad_cats = ["ulasim", "fatura_sabit_gider", "dijital_abonelik", "fatura", "abonelik"]
    for bc in bad_cats:
        db.query(Product).filter(Product.category == bc).delete()

    # 2. ADD PIZZA AND HAMBURGER
    fast_food = [
        {"name": "Büyük Boy Karışık Pizza", "category": "yemek_disari", "sub_category": "fast_food", "price": 280.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80"},
        {"name": "Hamburger Menü", "category": "yemek_disari", "sub_category": "fast_food", "price": 220.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"},
    ]
    for p_data in fast_food:
        if not db.query(Product).filter(Product.name == p_data["name"]).first():
            db.add(Product(**p_data))
    
    db.commit()
    print("Cleaned up categories and added fast food.")
finally:
    db.close()
