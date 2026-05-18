import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from app.db.database import SessionLocal
from app.db.models import Product, FixedExpense, User

db = SessionLocal()
try:
    # 1. ADD MISSING PRODUCTS FOR EMPTY CATEGORIES
    missing_products = [
        # Giyim
        {"name": "Pamuklu Tişört", "category": "giyim", "sub_category": "giyim", "price": 450.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80"},
        {"name": "Kışlık Mont", "category": "giyim", "sub_category": "giyim", "price": 3500.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80"},
        # Ulaşım
        {"name": "Aylık Akbil", "category": "ulasim", "sub_category": "ulasim", "price": 1400.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1534008897995-27a23e859048?w=400&q=80"},
        {"name": "Taksi Ücreti", "category": "ulasim", "sub_category": "ulasim", "price": 250.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1490650404312-a2175773bbf5?w=400&q=80"},
        # Dışarıda Yemek
        {"name": "Öğle Yemeği Menüsü", "category": "disarida_yemek", "sub_category": "yemek", "price": 350.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80"},
        {"name": "Lüks Akşam Yemeği", "category": "disarida_yemek", "sub_category": "yemek", "price": 2500.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&q=80"},
        # Sağlık
        {"name": "Vitamin Takviyesi", "category": "saglik", "sub_category": "saglik", "price": 650.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80"},
        {"name": "Ağrı Kesici", "category": "saglik", "sub_category": "saglik", "price": 85.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"},
        # Fatura & Sabit Gider (For the market tab just in case)
        {"name": "Örnek Fatura Ödemesi", "category": "fatura_sabit_gider", "sub_category": "fatura", "price": 500.0, "unit": "adet", "is_essential": True, "image_url": "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=400&q=80"},
        # Dijital Abonelik (For the market tab)
        {"name": "Premium Üyelik (Aylık)", "category": "dijital_abonelik", "sub_category": "abonelik", "price": 200.0, "unit": "adet", "is_essential": False, "image_url": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80"},
    ]
    for p_data in missing_products:
        if not db.query(Product).filter(Product.name == p_data["name"]).first():
            db.add(Product(**p_data))
    
    # 2. SEED FIXED EXPENSES FOR ALL USERS (so Profile page looks alive)
    users = db.query(User).all()
    for u in users:
        # Check if user already has fixed expenses
        if db.query(FixedExpense).filter(FixedExpense.user_id == u.id).count() == 0:
            db.add_all([
                FixedExpense(user_id=u.id, name="Ev Kirası", amount=15000.0, category="Konut", due_day=1),
                FixedExpense(user_id=u.id, name="Elektrik Faturası", amount=850.0, category="Fatura", due_day=15),
                FixedExpense(user_id=u.id, name="Su Faturası", amount=250.0, category="Fatura", due_day=20),
                FixedExpense(user_id=u.id, name="Netflix", amount=229.99, category="Abonelik", due_day=18),
                FixedExpense(user_id=u.id, name="Spotify", amount=59.99, category="Abonelik", due_day=22),
            ])

    db.commit()
    print("Seeded missing product categories and fixed expenses successfully.")

finally:
    db.close()
