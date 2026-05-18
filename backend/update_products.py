import sys
import os

# Add backend dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.db.database import SessionLocal
from app.db.models import Product
from app.services.seeder import seed_product_catalog

db = SessionLocal()
try:
    # Delete all products
    db.query(Product).delete()
    db.commit()
    print("Deleted all old products.")

    # Reseed products
    seed_product_catalog(db)
    print("Re-seeded products with images.")
finally:
    db.close()
