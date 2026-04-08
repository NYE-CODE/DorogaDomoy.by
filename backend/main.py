"""FastAPI application."""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from database import init_db, check_db_writable
import models  # noqa: F401 — регистрация ORM до init_db()
from rate_limit import limiter
from routers import auth, pets, users, reports, settings, telegram, notifications, sightings, media, partners, feature_flags, profile_pets, blog, faq
from telegram_bot import BOT_TOKEN, process_telegram_update

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)


async def _telegram_polling():
    """Long-polling loop for Telegram bot updates (local dev)."""
    import httpx
    api_url = f"https://api.telegram.org/bot{BOT_TOKEN}"
    offset = 0
    logger.info("Telegram bot polling started (@%s)", os.getenv("TELEGRAM_BOT_USERNAME", "?"))

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(f"{api_url}/deleteWebhook", json={"drop_pending_updates": True})
            logger.info("Webhook deleted, pending updates dropped")
        except Exception:
            pass

    async with httpx.AsyncClient(timeout=35) as client:
        while True:
            try:
                resp = await client.get(
                    f"{api_url}/getUpdates",
                    params={"offset": offset, "timeout": 30},
                )
                if resp.status_code == 409:
                    logger.warning("Telegram 409 Conflict — another polling instance detected, retrying deleteWebhook")
                    try:
                        await client.post(f"{api_url}/deleteWebhook", json={"drop_pending_updates": True})
                    except Exception:
                        pass
                    await asyncio.sleep(10)
                    continue
                if resp.status_code != 200:
                    logger.error("Telegram getUpdates error: %s", resp.text)
                    await asyncio.sleep(5)
                    continue
                data = resp.json()
                for update in data.get("result", []):
                    offset = update["update_id"] + 1
                    try:
                        await process_telegram_update(update)
                    except Exception as e:
                        logger.exception("Error processing update: %s", e)
            except httpx.ReadTimeout:
                continue
            except Exception as e:
                logger.exception("Telegram polling error: %s", e)
                await asyncio.sleep(5)


@asynccontextmanager
async def lifespan(app: FastAPI):
    UPLOADS_DIR.mkdir(exist_ok=True)
    init_db()
    db_info = check_db_writable()
    logger.info("DB health: %s", db_info)
    if not db_info.get("writable"):
        logger.error("DATABASE IS NOT WRITABLE! All write operations will fail. Details: %s", db_info)

    polling_task = None
    if BOT_TOKEN:
        polling_task = asyncio.create_task(_telegram_polling())
    else:
        logger.warning("TELEGRAM_BOT_TOKEN not set — bot polling disabled")

    yield

    if polling_task:
        polling_task.cancel()
        try:
            await polling_task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="DorogaDomoy.by API",
    description="API платформы поиска пропавших питомцев",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.middleware("http")
async def x_robots_tag_middleware(request, call_next):
    """Не индексировать служебные ответы API (Swagger, схема, корень JSON)."""
    response = await call_next(request)
    path = request.url.path
    if (
        path.startswith("/docs")
        or path.startswith("/redoc")
        or path == "/openapi.json"
        or path == "/"
    ):
        response.headers["X-Robots-Tag"] = "noindex, nofollow"
    return response

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001")

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
app.include_router(telegram.router)
app.include_router(notifications.router)
app.include_router(sightings.router)
app.include_router(media.router)
app.include_router(partners.router)
app.include_router(feature_flags.router)
app.include_router(profile_pets.router)
app.include_router(blog.router)
app.include_router(faq.router)


@app.get("/")
def root():
    return {"message": "DorogaDomoy.by API", "docs": "/docs"}


@app.get("/health")
def health():
    """Diagnostic endpoint: checks database read/write access."""
    info = check_db_writable()
    status_ok = info.get("writable", False)
    return {"status": "ok" if status_ok else "error"}
