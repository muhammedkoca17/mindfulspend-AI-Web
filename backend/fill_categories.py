import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.db.database import SessionLocal
from app.db.models import Product

db = SessionLocal()
try:
    # Sağlık - check if empty
    saglik_count = db.query(Product).filter(Product.category == "saglik").count()
    if saglik_count == 0:
        db.add_all([
            Product(name="Vitamin Takviyesi", category="saglik", sub_category="ilac", price=650.0, unit="adet", is_essential=True, image_url="https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80"),
            Product(name="Ağrı Kesici", category="saglik", sub_category="ilac", price=85.0, unit="adet", is_essential=True, image_url="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"),
            Product(name="Protein Tozu", category="saglik", sub_category="spor", price=1200.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1593095948071-474c414e6681?w=400&q=80"),
        ])
        print("Added Sağlık products")

    # Giyim - check if empty
    giyim_count = db.query(Product).filter(Product.category == "giyim").count()
    if giyim_count == 0:
        db.add_all([
            Product(name="Pamuklu Tişört", category="giyim", sub_category="temel_giyim", price=450.0, unit="adet", is_essential=True, image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"),
            Product(name="Kışlık Mont", category="giyim", sub_category="dis_giyim", price=3500.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80"),
        ])
        print("Added Giyim products")

    # Dışarıda Yemek - check if has pizza/hamburger (we already added, but verify yemek_disari exists)
    disarida_count = db.query(Product).filter(Product.category == "disarida_yemek").count()
    if disarida_count == 0:
        # use yemek_disari key from categories.py
        db.add_all([
            Product(name="Büyük Boy Karışık Pizza", category="yemek_disari", sub_category="fast_food", price=280.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80"),
            Product(name="Hamburger Menü", category="yemek_disari", sub_category="fast_food", price=220.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"),
            Product(name="Lahmacun", category="yemek_disari", sub_category="fast_food", price=120.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1603060652421-c3a41763e0ef?w=400&q=80"),
            Product(name="Türk Kahvesi", category="yemek_disari", sub_category="kafe", price=80.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&q=80"),
        ])
        print("Added Dışarıda Yemek products")

    # Also check if the old key "disarida_yemek" was used in fix_cats
    yemek_disari_count = db.query(Product).filter(Product.category == "yemek_disari").count()
    print(f"yemek_disari products: {yemek_disari_count}")

    # Print all category counts
    from sqlalchemy import func
    cats = db.query(Product.category, func.count(Product.id)).filter(Product.is_active == True).group_by(Product.category).all()
    print("\n=== CURRENT PRODUCT COUNTS ===")
    for cat, count in sorted(cats):
        print(f"  {cat}: {count}")

    db.commit()
    print("\nDone!")
finally:
    db.close()
