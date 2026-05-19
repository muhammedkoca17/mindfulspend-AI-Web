from app.core.config import settings
from app.core.gemini_agent import GeminiAgent
from app.db.models import Cart, Goal


def test_nudge_savings_calculations():
    # Force settings mock mode to test mock logic
    settings.gemini_api_key = "" # Disable Gemini to force mock logic

    agent = GeminiAgent()
    context = {
        "user_name": "Test User",
        "total_amount": 500.0,
        "essential_amount": 200.0,
        "discretionary_amount": 300.0,
        "items": [
            {"name": "Ekmek", "category": "Yiyecek", "is_essential": True, "total_price": 200.0}
        ],
        "goal_title": "Acil Durum Fonu",
        "days_delayed": 0.0,
        "saved_amount": 1200.0  # Simulated saved amount
    }
    
    msg = agent.generate_checkout_success_message(context)
    assert "1200" in msg
    assert "Acil Durum Fonu" in msg
    assert "tasarruf" in msg

def test_goal_update_logic_mocked():
    # Simulate DB objects
    cart = Cart(
        nudge_shown=True,
        nudge_discretionary_amount=1500.0
    )
    # Current cart state after removal of discretionary items:
    # Let's say discretionary_amount is now 300.0 (user saved 1200.0)
    current_discretionary_amount = 300.0
    
    primary_goal = Goal(
        title="Yeni Laptop",
        target_amount=20000.0,
        current_amount=5000.0,
        priority=1
    )
    
    saved_amount = max(0.0, cart.nudge_discretionary_amount - current_discretionary_amount)
    assert saved_amount == 1200.0
    
    if saved_amount > 0 and primary_goal:
        primary_goal.current_amount += saved_amount
        
    assert primary_goal.current_amount == 6200.0
