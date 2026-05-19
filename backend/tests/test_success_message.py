from app.core.gemini_agent import GeminiAgent
from app.core.config import settings

def test_success_message_mock_discretionary():
    # Force settings mock mode to test mock logic
    original_enabled = settings.gemini_api_key
    settings.gemini_api_key = "" # This disables Gemini call and forces mock

    agent = GeminiAgent()
    context = {
        "user_name": "Jury Test",
        "total_amount": 1000.0,
        "essential_amount": 200.0,
        "discretionary_amount": 800.0,
        "items": [
            {"name": "Cips", "category": "Yiyecek", "is_essential": False, "total_price": 50.0},
            {"name": "Akilli Saat", "category": "Elektronik", "is_essential": False, "total_price": 750.0},
            {"name": "Ekmek", "category": "Yiyecek", "is_essential": True, "total_price": 200.0}
        ],
        "goal_title": "Acil Durum Fonu",
        "days_delayed": 5.5
    }
    
    msg = agent.generate_checkout_success_message(context)
    assert "Cips" in msg
    assert "Akilli Saat" in msg
    assert "istege bagli" in msg
    assert "Acil Durum Fonu" in msg
    assert "5.5" in msg

def test_success_message_mock_essential_only():
    settings.gemini_api_key = ""

    agent = GeminiAgent()
    context = {
        "user_name": "Jury Test",
        "total_amount": 200.0,
        "essential_amount": 200.0,
        "discretionary_amount": 0.0,
        "items": [
            {"name": "Ekmek", "category": "Yiyecek", "is_essential": True, "total_price": 200.0}
        ],
        "goal_title": "Acil Durum Fonu",
        "days_delayed": 0.0
    }
    
    msg = agent.generate_checkout_success_message(context)
    assert "Tebrikler" in msg
    assert "Jury Test" in msg
    assert "Sadece temel" in msg
    assert "Acil Durum Fonu" in msg
