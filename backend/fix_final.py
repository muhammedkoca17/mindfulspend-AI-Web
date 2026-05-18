import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.db.database import SessionLocal
from app.db.models import Product

db = SessionLocal()
try:
    # Fix: rename "disarida_yemek" to "yemek_disari" to match categories.py
    db.query(Product).filter(Product.category == "disarida_yemek").update({"category": "yemek_disari"})
    
    # Add Sağlık extra if needed
    saglik_count = db.query(Product).filter(Product.category == "saglik").count()
    if saglik_count < 3:
        if not db.query(Product).filter(Product.name == "Protein Tozu").first():
            db.add(Product(name="Protein Tozu", category="saglik", sub_category="spor", price=1200.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1593095948071-474c414e6681?w=400&q=80"))
    
    # Add Lahmacun and Türk Kahvesi if missing
    if not db.query(Product).filter(Product.name == "Lahmacun").first():
        db.add(Product(name="Lahmacun", category="yemek_disari", sub_category="fast_food", price=120.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1603060652421-c3a41763e0ef?w=400&q=80"))
    if not db.query(Product).filter(Product.name == "Türk Kahvesi").first():
        db.add(Product(name="Türk Kahvesi", category="yemek_disari", sub_category="kafe", price=80.0, unit="adet", is_essential=False, image_url="https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400&q=80"))

    db.commit()

    # Print final counts
    from sqlalchemy import func
    cats = db.query(Product.category, func.count(Product.id)).filter(Product.is_active == True).group_by(Product.category).all()
    print("=== FINAL PRODUCT COUNTS ===")
    for cat, count in sorted(cats):
        print(f"  {cat}: {count}")
    print("Done!")
finally:
    db.close()
