import sys
import os

# Add backend folder to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.db.database import SessionLocal
from app.db.models import Product
from app.services.seeder import seed_product_catalog

def main():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        print("Clearing existing products from the database...")
        db.query(Product).delete()
        db.commit()
        print("Successfully deleted existing products.")
        
        print("Seeding new product catalog from product_catalog_updated_2026.xlsx...")
        seed_product_catalog(db)
        print(f"Product catalog seeded successfully. Total products: {db.query(Product).count()}")
    except Exception as e:
        db.rollback()
        print(f"Error during re-seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
