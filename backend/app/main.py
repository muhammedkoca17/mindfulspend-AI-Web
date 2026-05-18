"""FastAPI entrypoint — wires together middleware, lifespan hooks, and routers."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import analyze, nudge, rfm, transactions, users
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.cart import router as cart_router
from app.api.endpoints.dashboard import router as dashboard_router
from app.api.endpoints.goals import router as goals_router
from app.api.endpoints.onboarding import router as onboarding_router
from app.api.endpoints.products import router as products_router
from app.core.config import settings
from app.db.database import init_db
from app.services.ml_predictor import is_models_ready
from app.services.seeder import seed_if_empty

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("mindfulspend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting %s v%s ...", settings.app_name, settings.app_version)
    init_db()
    seed_if_empty()
    if not is_models_ready():
        log.warning(
            "ML models not found in %s — /analyze will return 503 until you run "
            "`python scripts/train_models.py`.",
            settings.models_dir,
        )
    if settings.gemini_enabled:
        log.info("Gemini live: model=%s", settings.gemini_model)
    else:
        log.info("Gemini in MOCK mode (no API key or USE_MOCK_GEMINI=true)")
    yield
    log.info("Shutting down.")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Behavioral-finance-driven autonomous budget agent. "
        "XGBoost detects impulsive spending in milliseconds; Google Gemini "
        "translates the result into a hyper-personalized Turkish nudge."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
        "gemini_mode": "live" if settings.gemini_enabled else "mock",
        "models_ready": is_models_ready(),
    }


@app.get("/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "models_ready": is_models_ready(),
        "gemini_enabled": settings.gemini_enabled,
    }


app.include_router(auth_router)
app.include_router(onboarding_router)
app.include_router(goals_router)
app.include_router(users.router)
app.include_router(transactions.router)
app.include_router(rfm.router)
app.include_router(analyze.router)
app.include_router(nudge.router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(dashboard_router)
