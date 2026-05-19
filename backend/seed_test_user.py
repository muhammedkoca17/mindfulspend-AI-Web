"""Seed a realistic test user with 2 months of evolving financial data.

Creates:
  - 1 test user (test.jury@mindfulspend.ai / 12345678)
  - ~70 transactions spread over 60 days simulating behavioral drift
  - Weekly RFM snapshots showing segment progression over time
  - Fixed expenses (rent, bills, subscriptions)
  - 2 financial goals with partial progress
  
The data simulates a user who starts as a "Sadık Tasarrufçu" (loyal saver)
and gradually becomes more impulsive, transitioning through "Risk Potansiyeli"
to "İmpulsif / Kırılgan" — showing the RFM model's detection capability live.
"""
import sys
import os
import random
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext

# Add current dir to path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, init_db
from app.db.models import (
    User, Transaction, RfmScore, NudgeLog,
    FixedExpense, Goal,
)
from app.services.rfm import compute_rfm

import pandas as pd

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── Configuration ────────────────────────────────────────────
TEST_EMAIL = "test.jury@mindfulspend.ai"
TEST_PASSWORD = "JuryTest123!"
TEST_NAME = "Jury Test Kullanıcısı"
SALARY = 45_000.0  # ₺45,000/month


def seed_test_user():
    init_db()
    db = SessionLocal()

    try:
        # ─── 1. Create or reset user ────────────────────────────
        user = db.query(User).filter(User.email == TEST_EMAIL).first()

        if user:
            print(f"[RESET] User '{TEST_EMAIL}' already exists (id={user.id}). Resetting data...")
            # Delete all related data
            db.query(NudgeLog).filter(NudgeLog.user_id == user.id).delete()
            db.query(RfmScore).filter(RfmScore.user_id == user.id).delete()
            db.query(Transaction).filter(Transaction.user_id == user.id).delete()
            db.query(FixedExpense).filter(FixedExpense.user_id == user.id).delete()
            db.query(Goal).filter(Goal.user_id == user.id).delete()
            db.commit()
            # Update profile
            user.monthly_salary = SALARY
            user.full_name = TEST_NAME
            user.risk_profile = "moderate"
            user.onboarding_completed = True
            user.age = 28
            user.hashed_password = pwd_context.hash(TEST_PASSWORD)
            db.commit()
        else:
            print(f"[NEW] Creating test user: {TEST_EMAIL}")
            user = User(
                email=TEST_EMAIL,
                hashed_password=pwd_context.hash(TEST_PASSWORD),
                full_name=TEST_NAME,
                monthly_salary=SALARY,
                risk_profile="moderate",
                onboarding_completed=True,
                age=28,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        user_id = user.id
        print(f"   User ID: {user_id}")

        # ─── 2. Generate 2 months of transactions ──────────────
        now = datetime.now(timezone.utc)
        transactions = []

        # Phase 1: Weeks 1-3 (days 60-40 ago) — CONSERVATIVE / SAVER
        # Only essential spending, very little discretionary
        print("\n[Phase 1] (60-40 days ago): Sadik Tasarrufcu behavior...")
        for day_offset in range(60, 39, -1):
            ts = now - timedelta(days=day_offset, hours=random.randint(8, 21), minutes=random.randint(0, 59))

            # Daily essentials (2-3 per day)
            if random.random() < 0.7:
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant="A101 Market",
                    category="Market",
                    spending_type="essential",
                    amount=round(random.uniform(150, 400), 2),
                    occurred_at=ts,
                    is_impulsive=0,
                    risk_probability=round(random.uniform(0.05, 0.15), 4),
                ))

            # Very rare discretionary (1 in 7 days)
            if random.random() < 0.15:
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant="Kahve Dünyası",
                    category="Kafe",
                    spending_type="discretionary",
                    amount=round(random.uniform(40, 80), 2),
                    occurred_at=ts + timedelta(hours=2),
                    is_impulsive=0,
                    risk_probability=round(random.uniform(0.08, 0.20), 4),
                ))

        # Phase 2: Weeks 4-5 (days 39-25 ago) — TRANSITIONING / RISK POTANSIYELI
        # Starting to spend more on discretionary
        print("[Phase 2] (39-25 days ago): Risk Potansiyeli transition...")
        discretionary_merchants = [
            ("Zara", "Giyim", 300, 900),
            ("Netflix", "Eğlence", 100, 100),
            ("Spotify", "Eğlence", 60, 60),
            ("Starbucks", "Kafe", 80, 200),
            ("Burger King", "Restoran", 120, 250),
            ("Teknosa", "Elektronik", 500, 2000),
        ]

        for day_offset in range(39, 24, -1):
            ts = now - timedelta(days=day_offset, hours=random.randint(9, 22), minutes=random.randint(0, 59))

            # Essential spending continues
            if random.random() < 0.6:
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant="Migros",
                    category="Market",
                    spending_type="essential",
                    amount=round(random.uniform(200, 500), 2),
                    occurred_at=ts,
                    is_impulsive=0,
                    risk_probability=round(random.uniform(0.05, 0.15), 4),
                ))

            # Increasing discretionary (2-3 per week)
            if random.random() < 0.35:
                m = random.choice(discretionary_merchants)
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant=m[0],
                    category=m[1],
                    spending_type="discretionary",
                    amount=round(random.uniform(m[2], m[3]), 2),
                    occurred_at=ts + timedelta(hours=random.randint(1, 4)),
                    is_impulsive=1 if random.random() < 0.3 else 0,
                    risk_probability=round(random.uniform(0.25, 0.55), 4),
                ))

        # Phase 3: Weeks 6-8 (days 24-1 ago) — IMPULSIVE / KIRILAN
        # High frequency + high monetary discretionary
        print("[Phase 3] (24-1 days ago): Impulsif / Kirilgan behavior...")
        impulsive_merchants = [
            ("Apple Store", "Elektronik", 2000, 8000),
            ("Boyner", "Giyim", 500, 3000),
            ("PlayStation Store", "Eğlence", 200, 1500),
            ("Hepsiburada", "Alışveriş", 300, 5000),
            ("Trendyol", "Alışveriş", 200, 2500),
            ("Steam", "Eğlence", 100, 800),
            ("Sortie AVM", "Eğlence", 500, 3000),
            ("Watsons", "Alışveriş", 150, 600),
        ]

        for day_offset in range(24, 0, -1):
            ts = now - timedelta(days=day_offset, hours=random.randint(10, 23), minutes=random.randint(0, 59))

            # Some essentials still
            if random.random() < 0.5:
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant="Şok Market",
                    category="Market",
                    spending_type="essential",
                    amount=round(random.uniform(100, 350), 2),
                    occurred_at=ts,
                    is_impulsive=0,
                    risk_probability=round(random.uniform(0.05, 0.12), 4),
                ))

            # Heavy discretionary spending (almost every day, sometimes 2x)
            if random.random() < 0.70:
                m = random.choice(impulsive_merchants)
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant=m[0],
                    category=m[1],
                    spending_type="discretionary",
                    amount=round(random.uniform(m[2], m[3]), 2),
                    occurred_at=ts + timedelta(hours=random.randint(1, 3)),
                    is_impulsive=1,
                    risk_probability=round(random.uniform(0.60, 0.95), 4),
                ))

            # Extra impulse purchase some days
            if random.random() < 0.35:
                m2 = random.choice(impulsive_merchants)
                transactions.append(Transaction(
                    user_id=user_id,
                    merchant=m2[0],
                    category=m2[1],
                    spending_type="discretionary",
                    amount=round(random.uniform(m2[2], m2[3]), 2),
                    occurred_at=ts + timedelta(hours=random.randint(4, 6)),
                    is_impulsive=1,
                    risk_probability=round(random.uniform(0.70, 0.98), 4),
                ))

        # Add a big recent purchase (yesterday)
        transactions.append(Transaction(
            user_id=user_id,
            merchant="Apple Store",
            category="Elektronik",
            spending_type="discretionary",
            amount=42_999.0,
            occurred_at=now - timedelta(hours=18),
            is_impulsive=1,
            risk_probability=0.96,
        ))

        db.add_all(transactions)
        db.commit()
        print(f"   [OK] Inserted {len(transactions)} transactions")

        # ─── 3. Generate weekly RFM snapshots ───────────────────
        # Simulate what the system would have computed each week
        print("\n[RFM] Computing weekly RFM snapshots for progression chart...")
        all_txs = db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.occurred_at).all()

        snapshot_weeks = [56, 49, 42, 35, 28, 21, 14, 7, 1]  # days ago for each snapshot
        for days_ago in snapshot_weeks:
            snapshot_date = now - timedelta(days=days_ago)
            visible_txs = [t for t in all_txs if t.occurred_at.replace(tzinfo=None) <= snapshot_date.replace(tzinfo=None)]
            
            if not visible_txs:
                continue

            df = pd.DataFrame([
                {
                    "occurred_at": t.occurred_at,
                    "amount": t.amount,
                    "spending_type": t.spending_type,
                }
                for t in visible_txs
            ])

            result = compute_rfm(df, reference_date=snapshot_date, window_days=30)

            rfm_record = RfmScore(
                user_id=user_id,
                computed_at=snapshot_date,
                recency_days=result.recency_days,
                frequency=result.frequency,
                monetary=result.monetary,
                r_score=result.r_score,
                f_score=result.f_score,
                m_score=result.m_score,
                rfm_risk=result.rfm_risk,
                segment=result.segment,
            )
            db.add(rfm_record)
            print(f"   Week -{days_ago:2d}d: R={result.r_score} F={result.f_score} M={result.m_score} "
                  f"Risk={result.rfm_risk:.2f} -> {result.segment}")

        db.commit()

        # ─── 4. Create fixed expenses ───────────────────────────
        print("\n[Fixed] Adding fixed expenses...")
        fixed = [
            FixedExpense(user_id=user_id, name="Kira", amount=12_000, category="housing", due_day=1),
            FixedExpense(user_id=user_id, name="Elektrik Faturası", amount=850, category="utilities", due_day=10),
            FixedExpense(user_id=user_id, name="Su Faturası", amount=350, category="utilities", due_day=12),
            FixedExpense(user_id=user_id, name="İnternet", amount=400, category="utilities", due_day=15),
            FixedExpense(user_id=user_id, name="Netflix", amount=100, category="subscription", due_day=5),
            FixedExpense(user_id=user_id, name="Spotify", amount=60, category="subscription", due_day=7),
            FixedExpense(user_id=user_id, name="Telefon Taksiti", amount=2_500, category="loan", due_day=20),
        ]
        db.add_all(fixed)
        db.commit()
        print(f"   [OK] {len(fixed)} fixed expenses added")

        # ─── 5. Create goals ────────────────────────────────────
        print("\n[Goals] Adding financial goals...")
        from datetime import date
        goals = [
            Goal(
                user_id=user_id,
                title="Acil Durum Fonu",
                target_amount=50_000,
                current_amount=18_500,
                target_date=date(2026, 12, 31),
                category="emergency",
                priority=1,
            ),
            Goal(
                user_id=user_id,
                title="Tatil Biriktirme",
                target_amount=25_000,
                current_amount=6_200,
                target_date=date(2026, 8, 15),
                category="vacation",
                priority=2,
            ),
        ]
        db.add_all(goals)
        db.commit()
        print(f"   [OK] {len(goals)} goals added")

        # ─── 6. Create nudge logs ───────────────────────────────
        print("\n[NudgeLogs] Adding historical nudge logs...")
        nudge_logs = []
        nudge_templates = {
            "loss_aversion": "Bu ürünü alarak Apple Store hedefini 5 gün erteleyeceksin! Kaçırma riskine değer mi?",
            "social_norms": "Senin yaş grubundaki diğer Tasarrufçular bu ay dışarıda yemek harcamasını %15 azalttı.",
            "planning": "Bu harcamayı yapmazsan, ay sonundaki tatile 1.200 TL daha fazla bütçe ayırabileceksin.",
            "positive_reinforcement": "Harika gidiyorsun! Bu hafta gereksiz harcamaları %30 kıstın, hedeflerine yaklaşıyorsun."
        }
        for i in range(25):
            days_ago_nudge = random.randint(1, 60)
            nudge_ts = now - timedelta(days=days_ago_nudge, hours=random.randint(1, 12))
            strat = random.choice(list(nudge_templates.keys()))
            nudge_logs.append(NudgeLog(
                user_id=user_id,
                strategy=strat,
                nudge_text=nudge_templates[strat],
                model="gemini-2.5-flash",
                latency_ms=random.randint(200, 800),
                created_at=nudge_ts
            ))
        db.add_all(nudge_logs)
        db.commit()
        print(f"   [OK] {len(nudge_logs)} nudge logs added")

        # ─── Summary ───────────────────────────────────────────
        total_disc = sum(t.amount for t in transactions if t.spending_type == "discretionary")
        total_ess = sum(t.amount for t in transactions if t.spending_type == "essential")
        disc_count = sum(1 for t in transactions if t.spending_type == "discretionary")
        ess_count = sum(1 for t in transactions if t.spending_type == "essential")

        print("\n" + "=" * 60)
        print("  [SUCCESS] TEST ACCOUNT READY")
        print("=" * 60)
        print(f"  Email:    {TEST_EMAIL}")
        print(f"  Password: {TEST_PASSWORD}")
        print(f"  Salary:   TL {SALARY:,.0f}")
        print(f"  Transactions: {len(transactions)} total")
        print(f"     Essential:      {ess_count} txns -> TL {total_ess:,.2f}")
        print(f"     Discretionary:  {disc_count} txns -> TL {total_disc:,.2f}")
        print(f"  RFM Snapshots:  {len(snapshot_weeks)} weekly points")
        print(f"  Fixed Expenses: {len(fixed)}")
        print(f"  Goals:          {len(goals)}")
        print(f"  Nudge Logs:     {len(nudge_logs)}")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_test_user()
