"""SQLAlchemy database setup with SQLite."""
import os
import logging
import uuid
from pathlib import Path

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

def _resolve_db_url() -> str:
    """Возвращает URL БД. Для относительного пути — резолвит относительно backend/."""
    url = os.getenv("DATABASE_URL", "sqlite:///./petfinder.db")
    if not url.startswith("sqlite"):
        return url
    path_part = url.replace("sqlite:///", "")
    # Абсолютный путь (sqlite:////var/lib/...) — не трогаем
    if path_part.startswith("/"):
        return url
    # Относительный: ./petfinder.db или petfinder.db
    backend_dir = Path(__file__).resolve().parent
    clean = path_part.replace("./", "").strip("/")
    abs_path = (backend_dir / clean).resolve()
    abs_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{abs_path}"

SQLALCHEMY_DATABASE_URL = _resolve_db_url()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    echo=False,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """Create all tables.

    Перед вызовом нужно импортировать пакет ``models``, чтобы все ORM-классы
    зарегистрировались в ``Base.metadata`` (см. ``main`` / ``seed``).
    """
    Base.metadata.create_all(bind=engine)
    _ensure_instagram_publications_columns()
    _ensure_bounty_and_helper_columns()
    logger.info("Database URL: %s", SQLALCHEMY_DATABASE_URL)


def _ensure_instagram_publications_columns() -> None:
    """Best-effort schema compatibility for older SQLite DBs.

    Some existing dev/prod databases may miss newly added columns because
    SQLAlchemy `create_all` does not alter existing tables.
    """
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    required_columns = {
        "source": "VARCHAR DEFAULT 'auto'",
        "requested_by_user_id": "VARCHAR",
        "requested_at": "DATETIME",
    }
    with engine.begin() as conn:
        table_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='instagram_publications'")
        ).fetchone()
        if not table_exists:
            return
        rows = conn.execute(text("PRAGMA table_info(instagram_publications)")).fetchall()
        existing = {row[1] for row in rows}
        for col_name, col_type in required_columns.items():
            if col_name in existing:
                continue
            conn.execute(text(f"ALTER TABLE instagram_publications ADD COLUMN {col_name} {col_type}"))
            logger.warning("Auto-migrated column instagram_publications.%s", col_name)


def _ensure_bounty_and_helper_columns() -> None:
    """Backfill newer reward/helper columns for legacy SQLite DBs."""
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return

    user_columns = {
        "telegram_id": "BIGINT",
        "telegram_username": "VARCHAR",
        "telegram_linked_at": "DATETIME",
        "helper_code": "VARCHAR",
        "helper_confirmed_count": "INTEGER DEFAULT 0",
        "points_balance": "INTEGER DEFAULT 0",
        "points_earned_total": "INTEGER DEFAULT 0",
    }
    pet_columns = {
        "reward_mode": "VARCHAR DEFAULT 'points'",
        "reward_amount_byn": "INTEGER",
        "reward_points": "INTEGER DEFAULT 50",
        "reward_recipient_user_id": "VARCHAR",
        "reward_points_awarded_at": "DATETIME",
    }
    partner_columns = {
        "is_medallion_partner": "INTEGER DEFAULT 0",
    }

    with engine.begin() as conn:
        # users.*
        users_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        ).fetchone()
        if users_exists:
            rows = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            existing = {row[1] for row in rows}
            for col_name, col_type in user_columns.items():
                if col_name in existing:
                    continue
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
                logger.warning("Auto-migrated column users.%s", col_name)

            # helper_code index + backfill
            conn.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_helper_code ON users(helper_code)")
            )
            user_ids = conn.execute(
                text("SELECT id FROM users WHERE helper_code IS NULL OR TRIM(helper_code) = ''")
            ).fetchall()
            for (uid,) in user_ids:
                helper_code = f"DD-{uuid.uuid4().hex[:8].upper()}"
                conn.execute(
                    text("UPDATE users SET helper_code = :code WHERE id = :uid"),
                    {"code": helper_code, "uid": uid},
                )

        # pets.*
        pets_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='pets'")
        ).fetchone()
        if pets_exists:
            rows = conn.execute(text("PRAGMA table_info(pets)")).fetchall()
            existing = {row[1] for row in rows}
            for col_name, col_type in pet_columns.items():
                if col_name in existing:
                    continue
                conn.execute(text(f"ALTER TABLE pets ADD COLUMN {col_name} {col_type}"))
                logger.warning("Auto-migrated column pets.%s", col_name)

            conn.execute(
                text("UPDATE pets SET reward_mode = 'points' WHERE reward_mode IS NULL OR TRIM(reward_mode) = ''")
            )
            conn.execute(
                text("UPDATE pets SET reward_points = 50 WHERE reward_points IS NULL OR reward_points <= 0")
            )

        # partners.*
        partners_exists = conn.execute(
            text("SELECT name FROM sqlite_master WHERE type='table' AND name='partners'")
        ).fetchone()
        if partners_exists:
            rows = conn.execute(text("PRAGMA table_info(partners)")).fetchall()
            existing = {row[1] for row in rows}
            for col_name, col_type in partner_columns.items():
                if col_name in existing:
                    continue
                conn.execute(text(f"ALTER TABLE partners ADD COLUMN {col_name} {col_type}"))
                logger.warning("Auto-migrated column partners.%s", col_name)

        # points_transactions table
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS points_transactions (
                    id VARCHAR PRIMARY KEY,
                    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    pet_id VARCHAR REFERENCES pets(id) ON DELETE SET NULL,
                    amount INTEGER NOT NULL,
                    kind VARCHAR NOT NULL,
                    note TEXT,
                    created_at DATETIME
                )
                """
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_points_transactions_user_id "
                "ON points_transactions(user_id)"
            )
        )


def check_db_writable() -> dict:
    """Return diagnostic info about the database file and write access."""
    info: dict = {"database_url": SQLALCHEMY_DATABASE_URL, "writable": False, "error": None}

    if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        db_path_str = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "")
        db_path = Path(db_path_str).resolve()
        info["resolved_path"] = str(db_path)
        info["file_exists"] = db_path.exists()
        info["dir_writable"] = os.access(str(db_path.parent), os.W_OK)
        info["file_writable"] = os.access(str(db_path), os.W_OK) if db_path.exists() else False

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        info["read_ok"] = True
    except Exception as e:
        info["read_ok"] = False
        info["error"] = str(e)
        return info
    finally:
        db.close()

    db = SessionLocal()
    try:
        db.execute(text(
            "CREATE TABLE IF NOT EXISTS _health_check (id INTEGER PRIMARY KEY, ts TEXT)"
        ))
        db.execute(text(
            "INSERT OR REPLACE INTO _health_check (id, ts) VALUES (1, datetime('now'))"
        ))
        db.commit()
        info["writable"] = True
    except Exception as e:
        db.rollback()
        info["writable"] = False
        info["error"] = str(e)
    finally:
        db.close()
    return info

