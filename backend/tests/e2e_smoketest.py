"""End-to-end smoke test — exercises analyze + real Gemini nudge.

Run after `uvicorn app.main:app` is up on :8000.
Prints a small report we can paste into the demo recap.
"""
from __future__ import annotations

import json
import sys

import httpx

BASE = "http://127.0.0.1:8000"


def heading(title: str) -> None:
    bar = "=" * 60
    print(f"\n{bar}\n{title}\n{bar}")


def main() -> int:
    client = httpx.Client(timeout=60)

    heading("1. /health")
    h = client.get(f"{BASE}/health").json()
    print(json.dumps(h, indent=2))
    if not h.get("models_ready"):
        print("ML models missing — abort.")
        return 1

    heading("2. /users")
    users = client.get(f"{BASE}/users").json()
    print(json.dumps(users, indent=2, ensure_ascii=False))
    if not users:
        print("No seeded user — abort.")
        return 1
    user_id = users[0]["id"]

    heading("3. /analyze — late-night discretionary anomaly")
    payload = {
        "user_id": user_id,
        "merchant": "Sortie Istanbul",
        "category": "Eğlence",
        "mcc_code": "5813",
        "amount": 12000,
        "occurred_at": "2026-05-13T02:30:00",
    }
    analysis = client.post(f"{BASE}/analyze", json=payload).json()
    print(json.dumps(analysis, indent=2, ensure_ascii=False))

    heading("4. /nudge — REAL Gemini call")
    nudge_payload = {
        "user_id": user_id,
        "transaction_id": analysis["transaction"]["id"],
        "risk_probability": analysis["risk_probability"],
        "rfm_segment": analysis["rfm_segment"],
        "context_overrides": {
            "merchant": payload["merchant"],
            "category": payload["category"],
            "amount": payload["amount"],
            "currency": "TRY",
        },
    }
    nudge = client.post(f"{BASE}/nudge", json=nudge_payload).json()
    print(json.dumps(nudge, indent=2, ensure_ascii=False))

    heading("5. /rfm/<user>")
    rfm = client.get(f"{BASE}/rfm/{user_id}").json()
    print(json.dumps(rfm, indent=2, ensure_ascii=False))

    heading("VERDICT")
    ok = bool(
        h["models_ready"]
        and analysis.get("rfm_segment")
        and len(nudge.get("nudge_text", "")) >= 40
    )
    print("PASS" if ok else "FAIL", "— is_mock:", nudge.get("is_mock"))
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
