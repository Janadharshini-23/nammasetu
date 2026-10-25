import os
import logging
from dotenv import load_dotenv

load_dotenv()  # must run before any os.getenv() calls below, including in other modules

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine, SessionLocal
from .seed import seed
from . import llm
from .routers import auth_routes, schemes, eligibility_routes, chat, documents, applications

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("schemesetu")

app = FastAPI(
    title="SchemeSetu API",
    description="AI-assisted navigator for Indian government schemes: eligibility matching, search and grounded Q&A.",
    version="0.1.0",
)

default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
]
env_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
origins = list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        added = seed(db)
        logger.info("Seeded %s schemes", added)
    finally:
        db.close()
    base_url, api_key, model, warning = llm.get_config()
    if base_url and api_key:
        logger.info("LLM configured: base_url=%s model=%s", base_url, model)
    else:
        logger.info("LLM not configured. Assistant will use retrieval-only answers.")
    if warning:
        logger.warning(warning)


@app.get("/api/health")
def health():
    base_url, api_key, model, warning = llm.get_config()
    return {
        "status": "ok",
        "llm_configured": bool(base_url and api_key),
        "llm_model": model if (base_url and api_key) else None,
        "llm_warning": warning,
    }


app.include_router(auth_routes.router)
app.include_router(schemes.router)
app.include_router(eligibility_routes.router)
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(applications.router)
