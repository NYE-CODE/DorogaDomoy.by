"""FastAPI application."""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import init_db, check_db_writable
from routers import auth, pets, users, reports, settings


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOADS_DIR.mkdir(exist_ok=True)
    init_db()
    db_info = check_db_writable()
    logger.info("DB health: %s", db_info)
    if not db_info.get("writable"):
        logger.error("DATABASE IS NOT WRITABLE! All write operations will fail. Details: %s", db_info)
    yield


app = FastAPI(
    title="DorogaDomoy.by API",
    description="API платформы поиска пропавших питомцев",
    version="1.0.0",
    lifespan=lifespan,
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.include_router(auth.router)
app.include_router(pets.router)
app.include_router(users.router)
app.include_router(reports.router)
app.include_router(settings.router)


@app.get("/")
def root():
    return {"message": "DorogaDomoy.by API", "docs": "/docs"}


@app.get("/health")
def health():
    """Diagnostic endpoint: checks database read/write access."""
    import os
    info = check_db_writable()
    info["cwd"] = os.getcwd()
    info["pid"] = os.getpid()
    info["uid"] = os.getuid() if hasattr(os, "getuid") else "N/A"
    status_ok = info.get("writable", False)
    return {"status": "ok" if status_ok else "error", "details": info}
