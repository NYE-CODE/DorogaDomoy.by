"""FastAPI application."""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import APIRouter, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from database import init_db, check_db_writable
import models  # noqa: F401 — регистрация ORM до init_db()
from rate_limit import limiter
from routers import auth, pets, users, reports, settings, telegram, notifications, media, partners, partner_ads, feature_flags, profile_pets, blog, faq, social_card, rewards, favorites, shelters, shelter_pets, shelter_campaigns, shelter_subscriptions, help, guides, internal_cron, integrations_susedzi
from telegram_bot import BOT_TOKEN, process_telegram_update

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

try:
    from routers import device_tokens
except Exception:
    device_tokens = None
    logging.getLogger(__name__).exception("device_tokens router skipped")

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


_docs_enabled = os.getenv("API_DOCS_ENABLED", "false").lower() in {"1", "true", "yes", "on"}

app = FastAPI(
    title="DorogaDomoy.by API",
    description="API экосистемы помощи животным: поиск, приюты и поддержка",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


def _public_validation_detail(errors: list) -> list[dict]:
    """Поле + сообщение без внутренних деталей Pydantic (input/ctx/url)."""
    out: list[dict] = []
    for err in errors:
        loc = [str(part) for part in err.get("loc", ()) if part != "body"]
        field = ".".join(loc) if loc else "body"
        msg = str(err.get("msg") or "Неверное значение")
        if msg.startswith("Value error, "):
            msg = msg[len("Value error, ") :]
        out.append({"field": field, "msg": msg})
    return out


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    """Отдаём field+msg; полный dump Pydantic — только при API_EXPOSE_VALIDATION_DETAILS."""
    errors = exc.errors()
    logger.warning("422 validation: path=%s errors=%s", request.url.path, errors)
    if os.getenv("API_EXPOSE_VALIDATION_DETAILS", "false").lower() in {"1", "true", "yes"}:
        return JSONResponse(status_code=422, content={"detail": errors})
    return JSONResponse(status_code=422, content={"detail": _public_validation_detail(errors)})


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

api_v1 = APIRouter(prefix="/api/v1")
api_v1.include_router(auth.router)
api_v1.include_router(pets.router)
api_v1.include_router(users.router)
api_v1.include_router(reports.router)
api_v1.include_router(settings.router)
api_v1.include_router(telegram.router)
api_v1.include_router(notifications.router)
api_v1.include_router(media.router)
api_v1.include_router(partners.router)
api_v1.include_router(partner_ads.router)
api_v1.include_router(feature_flags.router)
api_v1.include_router(profile_pets.router)
api_v1.include_router(blog.router)
api_v1.include_router(faq.router)
api_v1.include_router(help.router)
api_v1.include_router(guides.router)
api_v1.include_router(social_card.router)
api_v1.include_router(rewards.router)
api_v1.include_router(favorites.router)
api_v1.include_router(shelters.router)
api_v1.include_router(shelter_pets.router)
api_v1.include_router(shelter_campaigns.router)
api_v1.include_router(shelter_subscriptions.router)
api_v1.include_router(internal_cron.router)
api_v1.include_router(integrations_susedzi.router)
if device_tokens is not None:
    api_v1.include_router(device_tokens.router)
app.include_router(api_v1)


@app.get("/")
def root():
    return {"message": "DorogaDomoy.by API", "docs": "/docs", "api_v1": "/api/v1"}


@app.get("/health")
@limiter.exempt
def health():
    """Живость сервиса. Детали по БД — только при PUBLIC_HEALTH_INCLUDE_DB=true (для балансировщиков)."""
    payload: dict = {"status": "ok"}
    if os.getenv("PUBLIC_HEALTH_INCLUDE_DB", "").lower() in {"1", "true", "yes"}:
        info = check_db_writable()
        payload["database"] = "ok" if info.get("writable") else "error"
    return payload
