"""Product catalog API for the Virtual Market.

Public, browsable catalog with category/sub_category/essential filters.
No auth required for browsing — auth is only needed for cart operations.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product
from app.services.categories import CATEGORY_HIERARCHY, DISCRETIONARY_CATEGORIES

router = APIRouter(prefix="/products", tags=["Virtual Market - Products"])


@router.get("/")
def list_products(
    category: Optional[str] = None,
    sub_category: Optional[str] = None,
    is_essential: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List products with optional filters for the Virtual Market shelves."""
    query = db.query(Product).filter(Product.is_active == True)  # noqa: E712
    if category:
        query = query.filter(Product.category == category)
    if sub_category:
        query = query.filter(Product.sub_category == sub_category)
    if is_essential is not None:
        query = query.filter(Product.is_essential == is_essential)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    total = query.count()
    products = query.offset(offset).limit(limit).all()

    return {
        "total": total,
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "sub_category": p.sub_category,
                "price": p.price,
                "unit": p.unit,
                "is_essential": p.is_essential,
                "image_url": p.image_url,
                "stock": p.stock,
            }
            for p in products
        ],
    }


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    """List all product categories with product counts (for shelf tabs)."""
    results = (
        db.query(Product.category, func.count(Product.id).label("count"))
        .filter(Product.is_active == True)  # noqa: E712
        .group_by(Product.category)
        .all()
    )
    category_counts = {r.category: r.count for r in results}

    categories = []
    for key, data in CATEGORY_HIERARCHY.items():
        categories.append(
            {
                "key": key,
                "label": data["label"],
                "icon": data["icon"],
                "product_count": category_counts.get(key, 0),
                "is_essential": key not in DISCRETIONARY_CATEGORIES,
            }
        )
    return {"categories": categories}


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get a single product detail."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "sub_category": product.sub_category,
        "price": product.price,
        "unit": product.unit,
        "is_essential": product.is_essential,
        "image_url": product.image_url,
        "stock": product.stock,
    }
