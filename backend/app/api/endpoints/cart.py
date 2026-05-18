"""Shopping Cart API — core of the Virtual Market experience.

Flow:
1. User browses products -> adds to cart
2. User views cart -> sees items + totals + essential/discretionary breakdown
3. User clicks "Ode" -> /cart/checkout triggers ML analysis + nudge
4. Nudge popup shown -> user decides (accept/reject)
5. /cart/checkout/confirm finalizes -> creates Transaction rows with ML metadata
"""
from __future__ import annotations

from datetime import UTC, date, datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.endpoints.auth import get_current_user
from app.core.gemini_agent import GeminiAgent
from app.db.database import get_db
from app.db.models import Cart, CartItem, FixedExpense, Goal, Product, Transaction, User
from app.services.categories import DISCRETIONARY_CATEGORIES
from app.services.ml_predictor import is_models_ready, predict_all
from app.services.rfm import compute_rfm_live

router = APIRouter(prefix="/cart", tags=["Virtual Market - Cart"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class AddToCartRequest(BaseModel):
    product_id: int
    quantity: float = 1.0


class UpdateCartItemRequest(BaseModel):
    quantity: float


class CheckoutDecision(BaseModel):
    nudge_accepted: bool


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_or_create_active_cart(db: Session, user_id: int) -> Cart:
    cart = (
        db.query(Cart)
        .filter(Cart.user_id == user_id, Cart.status == "active")
        .first()
    )
    if not cart:
        cart = Cart(user_id=user_id, status="active")
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _calculate_cart_summary(cart: Cart) -> dict:
    total = 0.0
    essential_total = 0.0
    discretionary_total = 0.0
    items_data = []

    for item in cart.items:
        total += item.total_price
        if item.product.category in DISCRETIONARY_CATEGORIES or not item.product.is_essential:
            discretionary_total += item.total_price
        else:
            essential_total += item.total_price

        items_data.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "category": item.product.category,
            "sub_category": item.product.sub_category,
            "is_essential": item.product.is_essential,
            "quantity": item.quantity,
            "unit": item.product.unit,
            "unit_price": item.unit_price,
            "total_price": round(item.total_price, 2),
        })

    return {
        "cart_id": cart.id,
        "status": cart.status,
        "item_count": len(cart.items),
        "total_amount": round(total, 2),
        "essential_amount": round(essential_total, 2),
        "discretionary_amount": round(discretionary_total, 2),
        "discretionary_percent": round(discretionary_total / total * 100, 1) if total > 0 else 0,
        "items": items_data,
    }


def _build_cart_features(cart: Cart, user: User, db: Session) -> dict:
    """Build ML feature dict from live cart + user data."""
    now = datetime.now(UTC)
    total = sum(i.total_price for i in cart.items)
    qty = sum(i.quantity for i in cart.items)
    essential_count = sum(1 for i in cart.items if i.product.is_essential)

    # Live RFM
    rfm = compute_rfm_live(user.id, db)

    # User historical averages from DB (last 100 transactions, lightweight)
    past = (
        db.query(Transaction.amount)
        .filter(Transaction.user_id == user.id)
        .order_by(Transaction.occurred_at.desc())
        .limit(100)
        .all()
    )
    amounts = [r.amount for r in past] if past else [total]
    user_avg = sum(amounts) / len(amounts)
    if len(amounts) > 1:
        user_std = (sum((a - user_avg) ** 2 for a in amounts) / (len(amounts) - 1)) ** 0.5
    else:
        user_std = 1.0

    return {
        "hour": now.hour,
        "day_of_week": now.weekday(),
        "is_weekend": 1 if now.weekday() >= 5 else 0,
        "is_night": 1 if now.hour >= 22 else 0,
        "is_high_value": 1 if total > user_avg * 1.5 else 0,
        "is_essential": 1 if essential_count > len(cart.items) / 2 else 0,
        "deviation_from_avg": (total - user_avg) / max(user_std, 1.0),
        "r_score": rfm.r_score,
        "f_score": rfm.f_score,
        "m_score": rfm.m_score,
        "rfm_score": rfm.rfm_risk,
        "age": 30,
        "quantity": qty,
        "price": total / max(qty, 1),
        "amount_try": total,
    }


# ---------------------------------------------------------------------------
# Endpoints — cart CRUD
# ---------------------------------------------------------------------------
@router.get("/")
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cart = _get_or_create_active_cart(db, user.id)
    return _calculate_cart_summary(cart)


@router.post("/add")
def add_to_cart(
    data: AddToCartRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Urun bulunamadi")
    if not product.is_active:
        raise HTTPException(status_code=400, detail="Urun su an satista degil")

    cart = _get_or_create_active_cart(db, user.id)
    existing = (
        db.query(CartItem)
        .filter(CartItem.cart_id == cart.id, CartItem.product_id == data.product_id)
        .first()
    )
    if existing:
        existing.quantity += data.quantity
        existing.total_price = existing.quantity * existing.unit_price
    else:
        item = CartItem(
            cart_id=cart.id, product_id=data.product_id,
            quantity=data.quantity, unit_price=product.price,
            total_price=data.quantity * product.price,
        )
        db.add(item)

    db.commit()
    db.refresh(cart)
    return _calculate_cart_summary(cart)


@router.put("/item/{item_id}")
def update_cart_item(
    item_id: int,
    data: UpdateCartItemRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = (
        db.query(CartItem).join(Cart)
        .filter(CartItem.id == item_id, Cart.user_id == user.id, Cart.status == "active")
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Sepet kalemi bulunamadi")

    if data.quantity <= 0:
        db.delete(item)
    else:
        item.quantity = data.quantity
        item.total_price = item.quantity * item.unit_price
    db.commit()

    cart = _get_or_create_active_cart(db, user.id)
    return _calculate_cart_summary(cart)


@router.delete("/item/{item_id}")
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = (
        db.query(CartItem).join(Cart)
        .filter(CartItem.id == item_id, Cart.user_id == user.id, Cart.status == "active")
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Sepet kalemi bulunamadi")
    db.delete(item)
    db.commit()

    cart = _get_or_create_active_cart(db, user.id)
    return _calculate_cart_summary(cart)


@router.delete("/clear")
def clear_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    cart = _get_or_create_active_cart(db, user.id)
    for item in list(cart.items):
        db.delete(item)
    db.commit()
    return {"message": "Sepet temizlendi", "cart_id": cart.id}


# ---------------------------------------------------------------------------
# Checkout — two-step (ML analysis, then confirm)
# ---------------------------------------------------------------------------
@router.post("/checkout")
def checkout_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """STEP 1: Analyze cart with ML models and return nudge data."""
    cart = _get_or_create_active_cart(db, user.id)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Sepet bos")

    summary = _calculate_cart_summary(cart)

    # ML analysis
    ml_analysis = None
    rfm_data = None
    if is_models_ready():
        features = _build_cart_features(cart, user, db)
        ml_analysis = predict_all(features)
        rfm = compute_rfm_live(user.id, db)
        rfm_data = {
            "score": rfm.rfm_risk,
            "segment": rfm.segment,
            "r_score": rfm.r_score,
            "f_score": rfm.f_score,
            "m_score": rfm.m_score,
        }

    # Budget context
    goals = db.query(Goal).filter(Goal.user_id == user.id).order_by(Goal.priority).all()
    fixed_total = (
        db.query(func.sum(FixedExpense.amount))
        .filter(FixedExpense.user_id == user.id, FixedExpense.is_active == True)  # noqa: E712
        .scalar() or 0
    )
    disposable = (user.monthly_salary or 0) - fixed_total

    # Goal impact
    goal_impact = None
    if goals and disposable > 0:
        primary = goals[0]
        remaining = primary.target_amount - primary.current_amount
        if primary.target_date:
            days_left = max((primary.target_date - date.today()).days, 1)
            daily_needed = remaining / days_left
        else:
            daily_needed = remaining / 90
        days_delayed = round(summary["discretionary_amount"] / daily_needed, 1) if daily_needed > 0 else 0
        goal_impact = {
            "goal_title": primary.title,
            "goal_remaining": round(remaining, 2),
            "days_delayed_by_discretionary": days_delayed,
            "savings_if_removed": round(summary["discretionary_amount"], 2),
        }

    discretionary_items = [
        {"name": i["product_name"], "price": i["total_price"]}
        for i in summary["items"] if not i["is_essential"]
    ]

    # Gemini nudge generation (Function Calling)
    nudge_message = "Bu alisverisi degerlendir, ihtiyaclarini onceliklendir."
    needs_nudge = summary["discretionary_percent"] > 20 or summary["discretionary_amount"] > 100

    if needs_nudge:
        try:
            agent = GeminiAgent()
            gemini_context = {
                "user_id": user.id,
                "cart_id": cart.id,
                "discretionary_amount": summary["discretionary_amount"],
                "discretionary_items": discretionary_items,
                "goal_impact": goal_impact,
            }
            nudge_message = agent.generate_nudge(gemini_context, db=db)
        except Exception:
            nudge_message = "Sepetindeki istege bagli urunleri gozden gecirmeni oneririm."

    cart.nudge_shown = True
    cart.nudge_message = nudge_message
    db.commit()

    return {
        "cart_summary": summary,
        "ml_analysis": ml_analysis,
        "rfm": rfm_data,
        "needs_nudge": needs_nudge,
        "discretionary_items": discretionary_items,
        "goal_impact": goal_impact,
        "budget_context": {
            "monthly_salary": user.monthly_salary,
            "fixed_expenses": round(fixed_total, 2),
            "disposable_income": round(disposable, 2),
            "budget_usage_percent": round(summary["total_amount"] / disposable * 100, 1) if disposable > 0 else 0,
        },
        "nudge_message": nudge_message,
    }


@router.post("/checkout/confirm")
def confirm_checkout(
    decision: CheckoutDecision,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """STEP 2: Finalize purchase with nudge decision, save ML metadata."""
    cart = _get_or_create_active_cart(db, user.id)
    if not cart.items:
        raise HTTPException(status_code=400, detail="Sepet bos")

    # Get ML scores for metadata
    imp_score = 0.0
    if is_models_ready():
        features = _build_cart_features(cart, user, db)
        ml = predict_all(features)
        imp_score = ml["impulsive_score"]

    cart.nudge_accepted = decision.nudge_accepted
    cart.status = "checked_out"

    now = datetime.now(UTC)
    created = []
    for item in cart.items:
        tx = Transaction(
            user_id=user.id,
            occurred_at=now,
            item_name=item.product.name,
            amount=item.total_price,
            quantity=item.quantity,
            unit=item.product.unit,
            category=item.product.category,
            sub_category=item.product.sub_category,
            merchant="MindfulSpend Sanal Market",
            cart_id=cart.id,
            is_personal_entry=True,
            spending_type="essential" if item.product.is_essential else "discretionary",
            is_impulsive=1 if imp_score >= 0.5 else 0,
            risk_probability=round(imp_score, 4),
        )
        db.add(tx)
        created.append(tx)

    db.commit()
    total = round(sum(i.total_price for i in cart.items), 2)

    return {
        "message": "Alisveris tamamlandi",
        "cart_id": cart.id,
        "nudge_accepted": decision.nudge_accepted,
        "transaction_count": len(created),
        "total_amount": total,
        "impulsive_score": round(imp_score, 4),
    }
