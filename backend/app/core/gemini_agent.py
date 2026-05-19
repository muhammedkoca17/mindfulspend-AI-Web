"""MindfulSpend AI — Cognitive Engine (Gemini Agent) with Function Calling.

Two interfaces:
1. generate_nudge() — legacy sync for /nudge
2. generate_nudge_fc() — async Function Calling for cart checkout
3. chat_with_gemini() — async chat for /nudge/chat

Function Calling Tools:
  - get_user_budget: monthly salary, spending, remaining
  - get_user_goals: financial goals with progress
  - get_recent_transactions: last N days of transactions
  - calculate_goal_impact: how a spend delays goals

Behavioral Finance Strategies (Kahneman & Thaler):
  loss_aversion, social_norms, planning, positive_reinforcement
"""
from __future__ import annotations

import asyncio
import logging
import random
import time
from datetime import UTC, date, datetime, timedelta
from typing import Literal

from app.core.config import settings

log = logging.getLogger(__name__)

NudgeStrategy = Literal[
    "loss_aversion", "social_norms", "planning", "positive_reinforcement"
]

# ---------------------------------------------------------------------------
# System Prompts
# ---------------------------------------------------------------------------
NUDGE_SYSTEM_PROMPT = """\
Sen MindfulSpend AI'sin — Davranissal Finans uzmani, suclayici olmayan, \
destekleyici bir finansal koc. Daniel Kahneman'in Beklenti Teorisi ve Richard Thaler'in Nudge \
Teorisi konusunda uzmansin.

Gorev: Kullaniciya kisa, etkili, motive edici Turkce bir "durtme" (nudge) mesaji yaz.

Kesin kurallar:
1. Toplam yanit **en fazla 2 cumle** olmali.
2. ASLA suclayici/yargilayici kelimeler kullanma: "harcamamisin", "yanlis", "kotu karar", \
"israf" yasak.
3. Her zaman **uzun vadeli pozitif bir kazanim** hatirlat (tatil, birikim hedefi, gelecekteki \
ozgurluk gibi).
4. Sayiyi somut belirt (orn: "Bu 250 TL'yi...").
5. Empati kur, koruyucu/esit ton kullan.
6. Emoji kullanma.
7. Kayiptan kacinma (Loss Aversion) prensibini uygula."""

SUCCESS_SYSTEM_PROMPT = """\
Sen MindfulSpend AI'sin — Davranissal Finans uzmani ve destekleyici bir finansal kocsun. \
Kullanici sepetindeki urunleri satin alarak alisverisi tamamladi.

Gorev: Satin alinan tum urunleri, kategorilerini ve temel/istege bagli durumlarini analiz ederek \
kullaniciya kisa, etkili, samimi ve kisisellestirilmis bir Turkce geribildirim (basari) mesaji yaz.

Kesin kurallar:
1. Toplam yanit **en fazla 2 cumle** olmali.
2. Eger kullanici nudge uyarisi sonrasi geri donup istege bagli urunleri sepetten cikardiysa (Tasarruf Edilen Tutar > 0 ise): \
Kullaniciyi bu bilgece ve bilincli davranisindan oturu tebrik et. Vazgectigi tutarin (orn: "Tasarruf ettigin 450 TL...") \
aktif hedefine (orn: "Yeni Araba hedefine...") eklendigini vurgulayarak hedefine olan hizli ilerleyisini tebrik et.
3. Eger sepetinde ISTEGE BAGLI (discretionary/non-essential) urunler varsa: "Tebrikler", "Hedefine yaklastin" \
tarzi genel tebrik kaliplarini kullanma. Bunun yerine, satin aldigi istege bagli urunleri \
(orn: cips, akilli saat, cikolata) somut sekilde belirterek, bu harcamanin butcesine/hedeflerine olasi etkisini \
hatirlat ve gelecek sefere daha secici olmasi icin dürüst ve destekleyici bir dille geri bildirim ver.
4. Eger sepetinde SADECE TEMEL (essential) urunler varsa (ve Tasarruf Edilen Tutar = 0 ise): Kullaniciyi bütçe bilinci ve disiplini icin samimiyetle \
tebrik et, hedefine gercekten yaklastigini vurgula ve bu disiplinli davranisini ov.
5. ASLA suclayici/yargilayici kelimeler kullanma (israf, hata, kotu karar vb. yasak). Destekleyici ve yol gosterici ol.
6. Hazir/sabit kaliplar kullanma. Mesaj dogrudan sepetteki urunlere, kategorilere ve tasarruf edilen tutara ozel, dinamik olmalidir.
7. Sayilari somut belirt (orn: "Bu alisveristeki 3.659 TL istege bagli harcama...").
8. Emoji kullanma."""

CHAT_SYSTEM_PROMPT = """\
Sen MindfulSpend AI'nin finansal danismanisin.

## KIMLIGIN
- Davranissal finans ve Thaler'in Durtme Teorisi (Nudge Theory) konusunda uzmansin
- Kullaniciya ASLA sucululuk hissettirmezsin
- Her zaman pozitif, hedef odakli ve destekleyici bir tonla konusursun
- Turkce konusursun, samimi ama profesyonel bir dil kullanirsin
- "Sen" diye hitap edersin (resmi degil)

## YANITLAMA KURALLARIN
- Chat yanitlari: Kullanicinin sorusuna dogrudan cevap ver, gereksiz uzatma
- Her zaman kullanicinin GERCEK verilerini kullan (gelir, harcama, hedef)
- Genel tavsiye verme, kisisellestirilmis ol
- Sayilari kullan: "biraz tasarruf et" degil, "450 TL tasarruf edebilirsin"
- Hedeflere referans ver: "tatil fonuna aktarabilirsin" gibi
- Maksimum 3-4 cumle
- Emoji kullanma

## YASAK KELIMELER (kullanma)
harcamamisin, israf, yanlis, hata, kotu, gereksiz, sacma, luks (yargilayici anlamda)

Sana araçlar (tools) verilecek. Gerekirse kullanicinin butcesini, hedeflerini ve
son harcamalarini kontrol etmek icin bunlari kullan."""

STRATEGY_HINTS = {
    "loss_aversion": (
        "Strateji: Kayiptan Kacinma. Bu harcamanin yarattigi kayip duygusunu, "
        "tasarrufla geri kazanilabilecek somut bir hedefe cevir."
    ),
    "social_norms": (
        "Strateji: Sosyal Normlar. Benzer gelir grubundaki kullanicilarin basarisini "
        "yargilayici olmadan ornek goster."
    ),
    "planning": (
        "Strateji: Planlama Durtmesi. Yakin bir gelecekte gelecek sabit gideri/etkinligi "
        "hatirlat ve bu harcamayi ertelemenin etkisini goster."
    ),
    "positive_reinforcement": (
        "Strateji: Pozitif Pekistirme. Kullanicinin iyi bir finansal tercihini ov ve "
        "bu davranisa devam etmesi icin ileriye donuk somut bir kazanim sun."
    ),
}

STRATEGY_LABELS = {
    "loss_aversion": "Kayiptan Kacinma",
    "social_norms": "Sosyal Karsilastirma",
    "planning": "Butce Planlamasi",
    "positive_reinforcement": "Pozitif Pekistirme",
}


# ---------------------------------------------------------------------------
# Function Calling Tool Declarations
# ---------------------------------------------------------------------------
get_user_budget_func = {
    "name": "get_user_budget",
    "description": "Kullanicinin aylik butce durumunu getirir: maas, harcama, kalan",
    "parameters": {
        "type": "object",
        "properties": {
            "user_id": {"type": "integer", "description": "Kullanici ID"}
        },
        "required": ["user_id"]
    }
}

get_user_goals_func = {
    "name": "get_user_goals",
    "description": "Kullanicinin finansal hedeflerini getirir: tatil, araba, ev vb.",
    "parameters": {
        "type": "object",
        "properties": {
            "user_id": {"type": "integer", "description": "Kullanici ID"}
        },
        "required": ["user_id"]
    }
}

get_recent_transactions_func = {
    "name": "get_recent_transactions",
    "description": "Kullanicinin son N gunluk islemlerini getirir",
    "parameters": {
        "type": "object",
        "properties": {
            "user_id": {"type": "integer", "description": "Kullanici ID"},
            "days": {"type": "integer", "description": "Son kac gun"}
        },
        "required": ["user_id"]
    }
}

calculate_goal_impact_func = {
    "name": "calculate_goal_impact",
    "description": "Bu harcamanin kullanicinin hedefine etkisini hesaplar",
    "parameters": {
        "type": "object",
        "properties": {
            "user_id": {"type": "integer", "description": "Kullanici ID"},
            "amount": {"type": "number", "description": "Harcama tutari TRY"}
        },
        "required": ["user_id", "amount"]
    }
}

ALL_TOOLS = [
    get_user_budget_func,
    get_user_goals_func,
    get_recent_transactions_func,
    calculate_goal_impact_func,
]


# ---------------------------------------------------------------------------
# Function Implementations (query real DB)
# ---------------------------------------------------------------------------
def execute_function(function_name: str, args: dict, db, user_id: int) -> dict:
    """Execute a function call from Gemini and return result."""
    from sqlalchemy import func as sqlfunc

    from app.db.models import FixedExpense, Goal, Transaction, User

    if function_name == "get_user_budget":
        uid = args.get("user_id", user_id)
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            return {"error": "Kullanici bulunamadi"}

        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0)
        monthly_spending = (
            db.query(sqlfunc.sum(Transaction.amount))
            .filter(Transaction.user_id == uid, Transaction.occurred_at >= month_start)
            .scalar() or 0
        )
        fixed_total = (
            db.query(sqlfunc.sum(FixedExpense.amount))
            .filter(FixedExpense.user_id == uid, FixedExpense.is_active == True)  # noqa: E712
            .scalar() or 0
        )
        return {
            "monthly_salary": user.monthly_salary,
            "fixed_expenses": round(float(fixed_total), 2),
            "monthly_spending": round(float(monthly_spending), 2),
            "remaining_budget": round(user.monthly_salary - float(monthly_spending), 2),
            "spending_ratio": round(float(monthly_spending) / max(user.monthly_salary, 1), 2),
        }

    elif function_name == "get_user_goals":
        uid = args.get("user_id", user_id)
        goals = db.query(Goal).filter(Goal.user_id == uid).all()
        return [
            {
                "title": g.title,
                "target_amount": g.target_amount,
                "current_amount": g.current_amount,
                "remaining": round(g.target_amount - g.current_amount, 2),
                "target_date": str(g.target_date) if g.target_date else None,
                "days_left": (g.target_date - date.today()).days if g.target_date else None,
            }
            for g in goals
        ]

    elif function_name == "get_recent_transactions":
        uid = args.get("user_id", user_id)
        days = args.get("days", 30)
        cutoff = datetime.now(UTC) - timedelta(days=days)
        txs = (
            db.query(Transaction)
            .filter(Transaction.user_id == uid, Transaction.occurred_at >= cutoff)
            .order_by(Transaction.occurred_at.desc())
            .limit(20)
            .all()
        )
        return [
            {
                "item": tx.item_name or tx.category,
                "amount": tx.amount,
                "category": tx.category,
                "date": str(tx.occurred_at.date()) if tx.occurred_at else None,
                "spending_type": tx.spending_type,
            }
            for tx in txs
        ]

    elif function_name == "calculate_goal_impact":
        uid = args.get("user_id", user_id)
        amount = args.get("amount", 0)
        goals = db.query(Goal).filter(Goal.user_id == uid).all()
        impacts = []
        for g in goals:
            remaining = g.target_amount - g.current_amount
            if remaining <= 0:
                continue
            days_left = (g.target_date - date.today()).days if g.target_date else 90
            daily_need = remaining / max(days_left, 1)
            days_impact = round(amount / max(daily_need, 1))
            impacts.append({
                "goal": g.title,
                "days_delayed": days_impact,
                "message": f"Bu harcama '{g.title}' hedefini {days_impact} gun geciktirebilir",
            })
        return impacts

    return {"error": f"Unknown function: {function_name}"}


# ---------------------------------------------------------------------------
# Strategy selection
# ---------------------------------------------------------------------------
def select_strategy(rfm_segment: str, risk_probability: float) -> NudgeStrategy:
    if rfm_segment == "Sadik Tasarrufcu":
        return "positive_reinforcement"
    if rfm_segment == "Risk Potansiyeli":
        return "social_norms" if risk_probability < 0.7 else "planning"
    return "loss_aversion"


def select_strategy_from_context(context: dict) -> NudgeStrategy:
    budget_usage = context.get("budget_usage_percent", 0)
    discretionary_pct = context.get("discretionary_percent", 0)
    if budget_usage > 80:
        return "loss_aversion"
    if discretionary_pct > 40:
        return "planning"
    if budget_usage < 40:
        return "positive_reinforcement"
    return "social_norms"


# ---------------------------------------------------------------------------
# Context building
# ---------------------------------------------------------------------------
def _build_context_block(context: dict) -> str:
    lines = ["Mevcut baglam:"]
    for key, label in [
        ("merchant", "Satici"), ("category", "Kategori"),
        ("amount", "Tutar"), ("risk_probability", "Durtsel Olasilik"),
        ("rfm_segment", "Kullanici Segmenti"),
        ("remaining_budget", "Kalan Butce"), ("monthly_salary", "Aylik Gelir"),
    ]:
        if key in context and context[key] is not None:
            value = context[key]
            if key == "risk_probability":
                value = f"%{value * 100:.0f}"
            elif key in ("amount", "remaining_budget", "monthly_salary"):
                value = f"{value:,.0f} TL"
            lines.append(f"- {label}: {value}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Mock fallback
# ---------------------------------------------------------------------------
def _mock_nudge(strategy: NudgeStrategy, context: dict) -> str:
    amount = float(context.get("amount", context.get("cart_total", 0)))
    remaining = context.get("remaining_budget", 0)
    goals = context.get("goals", [])
    goal_name = goals[0]["title"] if goals else "tasarruf hedefin"

    templates = {
        "loss_aversion": [
            f"Bu {amount:,.0f} TL'yi {goal_name} icin biriktirirsen hedefe daha erken ulasirsin. "
            f"Kucuk bir erteleme, buyuk bir kazanim.",
        ],
        "social_norms": [
            "Seninle ayni gelir grubundaki kullanicilarin cogu bu hafta benzer harcamayi "
            "ertelemeyi secti — sen de denemek ister misin?",
        ],
        "planning": [
            f"Bu ay {remaining:,.0f} TL butcen kaldi. "
            f"Bu harcamayi haftaya ertelersen ay sonunu rahat kapatirsin.",
        ],
        "positive_reinforcement": [
            f"Harika gidiyorsun! Temel ihtiyaclara oncelik vermeye devam edersen "
            f"{goal_name} hedefine zamaninda ulasirsin!",
        ],
    }
    return random.choice(templates.get(strategy, templates["planning"]))


def _mock_chat(message: str, context: dict) -> str:
    remaining = context.get("remaining_budget", 0)
    salary = context.get("monthly_salary", 0)
    msg_lower = message.lower()

    if any(w in msg_lower for w in ["tasarruf", "biriktir", "nasil"]):
        return f"Aylik gelirin {salary:,.0f} TL. Istege bagli harcamalarini %10 azaltirsan ayda yaklasik {salary * 0.05:,.0f} TL tasarruf edebilirsin."
    if any(w in msg_lower for w in ["butce", "durum", "kalan"]):
        return f"Bu ay butcenin buyuk kismini kullandin. Kalan butcen {remaining:,.0f} TL."
    return f"Finansal durumunu inceledim. Kalan butcen {remaining:,.0f} TL. Sana nasil yardimci olabilirim?"


# ---------------------------------------------------------------------------
# Gemini API call helper
# ---------------------------------------------------------------------------
def _gemini_call(system_prompt: str, user_prompt: str) -> str:
    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_prompt,
        generation_config={"temperature": 0.7, "max_output_tokens": 2048, "top_p": 0.9},
    )
    response = model.generate_content(user_prompt)
    text = (response.text or "").strip()
    if not text:
        raise RuntimeError("Empty response from Gemini")
    return text


# ---------------------------------------------------------------------------
# Legacy sync API — used by /nudge endpoint
# ---------------------------------------------------------------------------
def generate_nudge(
    rfm_segment: str, risk_probability: float, context: dict,
) -> tuple[NudgeStrategy, str, int, bool]:
    """Returns: (strategy, nudge_text, latency_ms, is_mock)"""
    strategy = select_strategy(rfm_segment, risk_probability)
    context_block = _build_context_block(
        {**context, "rfm_segment": rfm_segment, "risk_probability": risk_probability}
    )
    start = time.perf_counter()
    is_mock = not settings.gemini_enabled
    try:
        if is_mock:
            text = _mock_nudge(strategy, context)
        else:
            user_prompt = f"{STRATEGY_HINTS[strategy]}\n\n{context_block}\n\nDurtme mesajini yaz:"
            text = _gemini_call(NUDGE_SYSTEM_PROMPT, user_prompt)
    except Exception as exc:
        log.warning("Gemini call failed (%s); falling back to mock", exc)
        text = _mock_nudge(strategy, context)
        is_mock = True
    latency_ms = int((time.perf_counter() - start) * 1000)
    return strategy, text, latency_ms, is_mock


# ---------------------------------------------------------------------------
# NEW: Async Function Calling nudge — for cart checkout
# ---------------------------------------------------------------------------
async def generate_nudge_fc(context: dict, db, user_id: int) -> dict:
    """Generate a Gemini nudge with Function Calling.

    context keys: cart_total, impulsive_score, budget_risk, rfm_segment,
                  nudge_acceptance_prob, items [{name, price, is_essential}]
    """
    start = time.perf_counter()
    is_mock = not settings.gemini_enabled

    if is_mock:
        strategy = select_strategy_from_context(context)
        text = _mock_nudge(strategy, context)
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "nudge_message": text,
            "strategy": strategy,
            "is_mock": True,
            "latency_ms": latency_ms,
        }

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        disc_items = [i for i in context.get("items", []) if not i.get("is_essential")]
        user_message = (
            f"Kullanici sepetinde {context.get('cart_total', 0):.0f} TL'lik alisveris var. "
            f"ML analizi: durtusal risk={context.get('impulsive_score', 0):.0%}, "
            f"butce riski={context.get('budget_risk', 0):.0%}. "
            f"RFM segmenti: {context.get('rfm_segment', 'bilinmiyor')}. "
            f"Istege bagli urunler: {', '.join(i['name'] + ' ' + str(i['price']) + ' TL' for i in disc_items) if disc_items else 'yok'}. "
            f"Kullanicinin butcesini ve hedeflerini kontrol et, sonra uygun bir nudge uret."
        )

        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=NUDGE_SYSTEM_PROMPT,
            tools=[{"function_declarations": ALL_TOOLS}],
            generation_config={"temperature": 0.7, "max_output_tokens": 256},
        )

        chat = model.start_chat()

        def _sync_chat():
            response = chat.send_message(user_message)
            # Handle up to 3 rounds of function calls
            for _ in range(3):
                if not response.candidates or not response.candidates[0].content.parts:
                    break
                fc_parts = [
                    p for p in response.candidates[0].content.parts
                    if hasattr(p, 'function_call') and p.function_call.name
                ]
                if not fc_parts:
                    break
                fn_responses = []
                for p in fc_parts:
                    result = execute_function(
                        p.function_call.name, dict(p.function_call.args), db, user_id
                    )
                    fn_responses.append(
                        genai.protos.Part(function_response=genai.protos.FunctionResponse(
                            name=p.function_call.name, response={"result": result}
                        ))
                    )
                response = chat.send_message(fn_responses)
            # Extract text
            text = ""
            for p in response.candidates[0].content.parts:
                if hasattr(p, 'text') and p.text:
                    text += p.text
            return text.strip()

        loop = asyncio.get_event_loop()
        nudge_text = await loop.run_in_executor(None, _sync_chat)

        if not nudge_text:
            nudge_text = _mock_nudge("loss_aversion", context)
            is_mock = True

        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "nudge_message": nudge_text,
            "strategy": "loss_aversion",
            "is_mock": False,
            "latency_ms": latency_ms,
        }

    except Exception as exc:
        log.warning("Gemini FC failed (%s); falling back to mock", exc)
        strategy = select_strategy_from_context(context)
        text = _mock_nudge(strategy, context)
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "nudge_message": text,
            "strategy": strategy,
            "is_mock": True,
            "latency_ms": latency_ms,
        }


# ---------------------------------------------------------------------------
# NEW: Async chat with Function Calling
# ---------------------------------------------------------------------------
async def chat_with_gemini(message: str, db, user_id: int) -> str:
    """Free-form chat with Gemini using Function Calling."""
    from sqlalchemy import func

    from app.db.models import FixedExpense, Transaction, User

    user = db.get(User, user_id)
    monthly_salary = user.monthly_salary if user else 0.0
    fixed_total = db.query(func.sum(FixedExpense.amount)).filter(FixedExpense.user_id == user_id).scalar() or 0.0
    
    # Calculate total discretionary spending in the last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    spent_30 = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.occurred_at >= cutoff,
        Transaction.spending_type == "discretionary"
    ).scalar() or 0.0
    
    remaining = max(monthly_salary - fixed_total - spent_30, 0.0)

    context = {
        "remaining_budget": remaining,
        "monthly_salary": monthly_salary
    }

    if not settings.gemini_enabled:
        return _mock_chat(message, context)

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=CHAT_SYSTEM_PROMPT,
            tools=[{"function_declarations": ALL_TOOLS}],
            generation_config={"temperature": 0.7, "max_output_tokens": 2048},
        )

        chat = model.start_chat()
        enriched = f"[Kullanici ID: {user_id}] {message}"

        def _sync_chat():
            response = chat.send_message(enriched)
            for _ in range(3):
                if not response.candidates or not response.candidates[0].content.parts:
                    break
                fc_parts = [
                    p for p in response.candidates[0].content.parts
                    if hasattr(p, 'function_call') and p.function_call.name
                ]
                if not fc_parts:
                    break
                fn_responses = []
                for p in fc_parts:
                    result = execute_function(
                        p.function_call.name, dict(p.function_call.args), db, user_id
                    )
                    fn_responses.append(
                        genai.protos.Part(function_response=genai.protos.FunctionResponse(
                            name=p.function_call.name, response={"result": result}
                        ))
                    )
                response = chat.send_message(fn_responses)
            text = ""
            for p in response.candidates[0].content.parts:
                if hasattr(p, 'text') and p.text:
                    text += p.text
            return text.strip()

        loop = asyncio.get_event_loop()
        reply = await loop.run_in_executor(None, _sync_chat)
        return reply or "Su an yanit uretemiyorum, lutfen tekrar dene."

    except Exception as exc:
        log.warning("Gemini chat failed (%s); mock response", exc)
        return _mock_chat(message, context)


# ---------------------------------------------------------------------------
# GeminiAgent class (backward compat for /nudge/cart-nudge)
# ---------------------------------------------------------------------------
class GeminiAgent:
    """Function Calling Agent for cart checkout nudge (sync)."""

    def generate_checkout_success_message(self, context: dict) -> str:
        """Generate dynamic checkout success feedback based on purchased items and categories."""
        user_name = context.get("user_name", "Kullanici")
        total_amount = context.get("total_amount", 0.0)
        essential_amount = context.get("essential_amount", 0.0)
        discretionary_amount = context.get("discretionary_amount", 0.0)
        items = context.get("items", [])
        goal_title = context.get("goal_title")
        days_delayed = context.get("days_delayed", 0.0)
        saved_amount = context.get("saved_amount", 0.0)

        # Separate items
        [i["name"] for i in items if i["is_essential"]]
        discretionary_names = [i["name"] for i in items if not i["is_essential"]]

        is_mock = not settings.gemini_enabled
        if is_mock:
            # Fallback mock success message
            if saved_amount > 0:
                msg = f"Nudge uyarimizi dikkate alip istege bagli harcamalardan vazgecerek {saved_amount:.0f} TL tasarruf ettin!"
                if goal_title:
                    msg += f" Bu tutar '{goal_title}' hedefine aktarildi ve hedefine bir adim daha yaklastin."
                return msg
            if discretionary_names:
                item_names = ", ".join(discretionary_names[:3])
                if len(discretionary_names) > 3:
                    item_names += " ve diger"
                msg = f"Satin aldigin {item_names} gibi istege bagli urunler icin harcadigin {discretionary_amount:.0f} TL butceni etkileyebilir."
                if goal_title and days_delayed > 0:
                    msg += f" Bu tercih, '{goal_title}' hedefini {days_delayed:.1f} gun ertelemene yol acabilir."
                else:
                    msg += " Bir sonraki alisverisinde bu kategorileri sinirlandirmayi dusunebilirsin."
                return msg
            else:
                msg = f"Tebrikler {user_name}! Sadece temel ihtiyaclari iceren bu bilincli alisverisin ile butceni korudun"
                if goal_title:
                    msg += f" ve '{goal_title}' hedefine bir adim daha yaklastin."
                else:
                    msg += " ve birikim hedeflerine bagli kaldin."
                return msg

        try:
            # Construct user prompt
            items_str = "\n".join(
                f"- {i['name']} ({i['category']}): {i['total_price']} TL ({'Temel' if i['is_essential'] else 'Istege Bagli'})"
                for i in items
            )
            
            user_prompt = (
                f"Kullanici Adi: {user_name}\n"
                f"Toplam Harcama: {total_amount:.2f} TL\n"
                f"Temel Harcama: {essential_amount:.2f} TL\n"
                f"Istege Bagli Harcama: {discretionary_amount:.2f} TL\n"
                f"Tasarruf Edilen Tutar: {saved_amount:.2f} TL\n"
                f"Hedef: {goal_title or 'Yok'}\n"
                f"Hedef Erteleme: {days_delayed:.1f} gun\n\n"
                f"Satin Alinan Urunler:\n{items_str}\n\n"
                f"Lutfen bu verilere gore geri bildirim mesaji yaz:"
            )

            text = _gemini_call(SUCCESS_SYSTEM_PROMPT, user_prompt)
            return text
        except Exception as exc:
            log.warning("Gemini checkout success call failed (%s); using mock fallback", exc)
            # Re-run mock logic as fallback
            if saved_amount > 0:
                msg = f"Nudge uyarimizi dikkate alip istege bagli harcamalardan vazgecerek {saved_amount:.0f} TL tasarruf ettin!"
                if goal_title:
                    msg += f" Bu tutar '{goal_title}' hedefine aktarildi ve hedefine bir adim daha yaklastin."
                return msg
            if discretionary_names:
                item_names = ", ".join(discretionary_names[:3])
                if len(discretionary_names) > 3:
                    item_names += " ve diger"
                msg = f"Satin aldigin {item_names} gibi istege bagli urunler icin harcadigin {discretionary_amount:.0f} TL butceni etkileyebilir."
                if goal_title and days_delayed > 0:
                    msg += f" Bu tercih, '{goal_title}' hedefini {days_delayed:.1f} gun ertelemene yol acabilir."
                else:
                    msg += " Bir sonraki alisverisinde bu kategorileri sinirlandirmayi dusunebilirsin."
                return msg
            else:
                msg = f"Tebrikler {user_name}! Sadece temel ihtiyaclari iceren bu bilincli alisverisin ile butceni korudun"
                if goal_title:
                    msg += f" ve '{goal_title}' hedefine bir adim daha yaklastin."
                else:
                    msg += " ve birikim hedeflerine bagli kaldin."
                return msg

    def generate_nudge(self, context: dict, db=None) -> str:
        if db is None or not settings.gemini_enabled:
            return self._simple_nudge(context)
        try:
            return self._agentic_nudge(context, db)
        except Exception as exc:
            log.warning("GeminiAgent FC failed (%s), using fallback", exc)
            return self._simple_nudge(context)

    def _agentic_nudge(self, context: dict, db) -> str:
        import google.generativeai as genai
        genai.configure(api_key=settings.gemini_api_key)

        model = genai.GenerativeModel(
            model_name=settings.gemini_model,
            system_instruction=NUDGE_SYSTEM_PROMPT,
            generation_config={"temperature": 0.7, "max_output_tokens": 256},
        )

        user_message = (
            f"Kullanici {context.get('user_id')} sepetini onaylamak uzere "
            f"(sepet {context.get('cart_id')}). "
            f"Istege bagli harcama: {context.get('discretionary_amount', 0):.2f} TL. "
            f"Araclarini kullanarak kullanicinin finansal durumunu ogren, "
            f"sonra Turkce kisisel bir nudge mesaji yaz (maksimum 2 cumle)."
        )

        messages = [{"role": "user", "parts": [user_message]}]

        for _ in range(3):
            response = model.generate_content(
                messages,
                tools=[{"function_declarations": ALL_TOOLS}],
                tool_config={"function_calling_config": {"mode": "AUTO"}},
            )
            candidate = response.candidates[0]
            tool_calls = [
                p for p in candidate.content.parts
                if hasattr(p, "function_call") and p.function_call.name
            ]
            if not tool_calls:
                text_parts = [p.text for p in candidate.content.parts if hasattr(p, "text") and p.text]
                result = " ".join(text_parts).strip()
                return result if result else self._simple_nudge(context)

            messages.append({"role": "model", "parts": candidate.content.parts})
            tool_results = []
            for p in tool_calls:
                fc = p.function_call
                fn_result = execute_function(fc.name, dict(fc.args), db, context.get("user_id", 0))
                tool_results.append({"function_response": {"name": fc.name, "response": fn_result}})
            messages.append({"role": "user", "parts": tool_results})

        return self._simple_nudge(context)

    def _simple_nudge(self, context: dict) -> str:
        disc_amount = context.get("discretionary_amount", 0)
        disc_items = context.get("discretionary_items", [])
        goal_impact = context.get("goal_impact")
        item_names = ", ".join([i["name"] for i in disc_items[:3]]) if disc_items else "istege bagli urunler"

        if goal_impact and goal_impact.get("days_delayed", 0) > 0.5:
            return (
                f"{item_names} icin harcayacagin {disc_amount:.0f} TL'yi "
                f"tasarrufa eklersen, '{goal_impact['goal_title']}' hedefine "
                f"{goal_impact['days_delayed']:.1f} gun daha erken ulasirsin."
            )
        return (
            f"Sepetindeki {item_names} ({disc_amount:.0f} TL) istege bagli urunler. "
            f"Bunlari cikararak bu ay butceni daha rahat yonetebilirsin."
        )


# Singleton agent
_agent_instance: MindfulSpendAgent | None = None


class MindfulSpendAgent:
    """Async agent for enhanced nudge and chat (backward compat)."""

    def __init__(self):
        self.is_mock = not settings.gemini_enabled

    async def generate_nudge(self, context: dict) -> dict:
        strategy = select_strategy_from_context(context)
        text = _mock_nudge(strategy, context)
        return {"strategy": strategy, "message": text, "is_mock": True, "latency_ms": 0}

    async def chat(self, user_message: str, context: dict) -> dict:
        text = _mock_chat(user_message, context)
        return {"message": text, "is_mock": True, "latency_ms": 0}


def get_agent() -> MindfulSpendAgent:
    global _agent_instance
    if _agent_instance is None:
        _agent_instance = MindfulSpendAgent()
    return _agent_instance
