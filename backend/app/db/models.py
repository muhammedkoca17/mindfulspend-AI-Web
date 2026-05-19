"""SQLAlchemy ORM models — User, Transaction, RfmScore, NudgeLog, FixedExpense, Goal."""
from datetime import UTC, date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def _utcnow() -> datetime:
    return datetime.now(UTC)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    hashed_password: Mapped[str] = mapped_column(String(255), default="")
    monthly_income: Mapped[float] = mapped_column(Float, default=0.0)
    monthly_salary: Mapped[float] = mapped_column(Float, default=0.0)
    budget_goal: Mapped[float] = mapped_column(Float, default=0.0)
    financial_scenario: Mapped[str] = mapped_column(String(32), default="normal")
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_profile: Mapped[str] = mapped_column(String(32), default="moderate")  # saver, moderate, spender
    age: Mapped[int] = mapped_column(Integer, default=30)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    rfm_scores: Mapped[list["RfmScore"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    nudges: Mapped[list["NudgeLog"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    fixed_expenses: Mapped[list["FixedExpense"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    carts: Mapped[list["Cart"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)
    merchant: Mapped[str] = mapped_column(String(255), default="")
    category: Mapped[str] = mapped_column(String(64), index=True)
    mcc_code: Mapped[str] = mapped_column(String(8), default="5999")
    amount: Mapped[float] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(8), default="TRY")
    payment_mode: Mapped[str] = mapped_column(String(32), default="card")
    spending_type: Mapped[str] = mapped_column(String(16), default="discretionary")  # essential | discretionary
    is_impulsive: Mapped[int] = mapped_column(Integer, default=0)  # 0/1 flag from XGBoost
    risk_probability: Mapped[float] = mapped_column(Float, default=0.0)

    # New fields for manual item-level entry
    item_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit: Mapped[str] = mapped_column(String(16), default="adet")  # kg, adet, litre
    sub_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_personal_entry: Mapped[bool] = mapped_column(Boolean, default=False)

    # Virtual Market — which cart this transaction came from (optional)
    cart_id: Mapped[int | None] = mapped_column(ForeignKey("carts.id"), nullable=True)

    user: Mapped["User"] = relationship(back_populates="transactions")


class RfmScore(Base):
    __tablename__ = "rfm_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    recency_days: Mapped[float] = mapped_column(Float)
    frequency: Mapped[int] = mapped_column(Integer)
    monetary: Mapped[float] = mapped_column(Float)
    r_score: Mapped[int] = mapped_column(Integer)
    f_score: Mapped[int] = mapped_column(Integer)
    m_score: Mapped[int] = mapped_column(Integer)
    rfm_risk: Mapped[float] = mapped_column(Float)
    segment: Mapped[str] = mapped_column(String(32))  # Sadik Tasarrufcu | Risk Potansiyeli | Impulsif/Kirilgan

    user: Mapped["User"] = relationship(back_populates="rfm_scores")


class NudgeLog(Base):
    __tablename__ = "nudge_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    transaction_id: Mapped[int | None] = mapped_column(ForeignKey("transactions.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    strategy: Mapped[str] = mapped_column(String(64))  # loss_aversion | social_norms | planning | positive_reinforcement
    nudge_text: Mapped[str] = mapped_column(Text)
    model: Mapped[str] = mapped_column(String(64), default="gemini-2.5-flash")
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="nudges")


class FixedExpense(Base):
    """Monthly recurring expenses: rent, bills, subscriptions."""
    __tablename__ = "fixed_expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(64), default="other")  # housing, utilities, subscription, loan, insurance
    due_day: Mapped[int] = mapped_column(Integer, default=1)  # day of month (1-31)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    user: Mapped["User"] = relationship(back_populates="fixed_expenses")


class Goal(Base):
    """User financial goals: vacation, car, emergency fund, etc."""
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    target_amount: Mapped[float] = mapped_column(Float)
    current_amount: Mapped[float] = mapped_column(Float, default=0.0)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    category: Mapped[str] = mapped_column(String(64), default="other")  # vacation, car, home, emergency, education, other
    priority: Mapped[int] = mapped_column(Integer, default=1)  # 1=high, 2=medium, 3=low
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    user: Mapped["User"] = relationship(back_populates="goals")


class Product(Base):
    """Virtual Market product catalog. Seeded from realistic Turkish market data."""
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    item_code: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    sub_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    category_name1: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category_name2: Mapped[str | None] = mapped_column(String(128), nullable=True)
    category_name3: Mapped[str | None] = mapped_column(String(128), nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(16), default="adet")
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_essential: Mapped[bool] = mapped_column(Boolean, default=True)
    total_sold: Mapped[int] = mapped_column(Integer, default=0)
    price_tier_global: Mapped[str | None] = mapped_column(String(64), nullable=True)
    price_tier_category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    necessity_auto: Mapped[str | None] = mapped_column(String(64), nullable=True)
    necessity_final: Mapped[str | None] = mapped_column(String(64), nullable=True)
    popularity: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    stock: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Cart(Base):
    """User shopping cart. One active cart per user at a time."""
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), default="active")  # active | checked_out | abandoned
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    # Nudge tracking
    nudge_shown: Mapped[bool] = mapped_column(Boolean, default=False)
    nudge_accepted: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    nudge_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    nudge_discretionary_amount: Mapped[float] = mapped_column(Float, default=0.0)
    saved_amount: Mapped[float] = mapped_column(Float, default=0.0)

    user: Mapped["User"] = relationship(back_populates="carts")
    items: Mapped[list["CartItem"]] = relationship(
        back_populates="cart", cascade="all, delete-orphan"
    )


class CartItem(Base):
    """Single line item inside a Cart, referencing a Product."""
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)

    cart: Mapped["Cart"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()
