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
    _ensure_shelters_table()
    _ensure_shelter_pet_details_table()
    _ensure_shelter_campaigns_table()
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
        "registered_as_volunteer": "INTEGER DEFAULT 0",
    }
    pet_columns = {
        "reward_mode": "VARCHAR DEFAULT 'points'",
        "reward_amount_byn": "INTEGER",
        "reward_points": "INTEGER DEFAULT 50",
        "reward_recipient_user_id": "VARCHAR",
        "reward_points_awarded_at": "DATETIME",
        "pet_scope": "VARCHAR DEFAULT 'lost_found'",
        "shelter_id": "VARCHAR",
        "adoption_status": "VARCHAR",
        "is_published": "INTEGER DEFAULT 1",
        "published_by_user_id": "VARCHAR",
        "updated_by_user_id": "VARCHAR",
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

            conn.execute(
                text("UPDATE users SET role = 'volunteer' WHERE role = 'shelter'")
            )

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
            conn.execute(
                text("UPDATE pets SET pet_scope = 'lost_found' WHERE pet_scope IS NULL OR TRIM(pet_scope) = ''")
            )
            conn.execute(
                text("UPDATE pets SET is_published = 1 WHERE is_published IS NULL")
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_pets_shelter_id ON pets(shelter_id)"))

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


def _ensure_shelters_table() -> None:
    """Таблица приютов для существующих SQLite БД (create_all не меняет старые файлы)."""
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS shelters (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    kind VARCHAR NOT NULL DEFAULT 'shelter',
                    animal_focus VARCHAR NOT NULL DEFAULT 'mixed',
                    description TEXT,
                    city VARCHAR NOT NULL,
                    address VARCHAR,
                    location_lat FLOAT NOT NULL,
                    location_lng FLOAT NOT NULL,
                    contacts TEXT NOT NULL DEFAULT '{}',
                    logo_url VARCHAR,
                    cover_url VARCHAR,
                    moderation_status VARCHAR NOT NULL DEFAULT 'draft',
                    moderation_reason TEXT,
                    moderated_at DATETIME,
                    moderated_by VARCHAR,
                    owner_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    created_at DATETIME,
                    updated_at DATETIME
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_shelters_owner ON shelters(owner_user_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_shelters_status ON shelters(moderation_status)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_shelters_city ON shelters(city)"))
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS shelter_memberships (
                    id VARCHAR PRIMARY KEY,
                    shelter_id VARCHAR NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
                    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    role VARCHAR NOT NULL DEFAULT 'volunteer',
                    status VARCHAR NOT NULL DEFAULT 'active',
                    invited_by_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
                    joined_at DATETIME,
                    removed_at DATETIME,
                    created_at DATETIME,
                    updated_at DATETIME
                )
                """
            )
        )
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_shelter_memberships_shelter_user "
                "ON shelter_memberships(shelter_id, user_id)"
            )
        )
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_shelter_memberships_shelter ON shelter_memberships(shelter_id)")
        )
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS ix_shelter_memberships_user ON shelter_memberships(user_id)")
        )
        rows = conn.execute(text("PRAGMA table_info(shelters)")).fetchall()
        existing_cols = {row[1] for row in rows}
        if "animal_focus" not in existing_cols:
            conn.execute(
                text(
                    "ALTER TABLE shelters ADD COLUMN animal_focus VARCHAR NOT NULL DEFAULT 'mixed'"
                )
            )
            logger.warning("Auto-migrated column shelters.animal_focus")
        if "cover_url" not in existing_cols:
            conn.execute(text("ALTER TABLE shelters ADD COLUMN cover_url VARCHAR"))
            logger.warning("Auto-migrated column shelters.cover_url")
        # Backfill owner membership for shelters that don't have one yet.
        conn.execute(
            text(
                """
                INSERT INTO shelter_memberships (
                    id, shelter_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at
                )
                SELECT
                    'shm-' || substr(lower(hex(randomblob(16))), 1, 10),
                    s.id,
                    s.owner_user_id,
                    'owner',
                    'active',
                    s.owner_user_id,
                    s.created_at,
                    s.created_at,
                    s.updated_at
                FROM shelters s
                LEFT JOIN shelter_memberships m
                    ON m.shelter_id = s.id AND m.user_id = s.owner_user_id
                WHERE m.id IS NULL
                """
            )
        )


def _ensure_shelter_pet_details_table() -> None:
    """Transition table for shelter domain fields with read-through backfill."""
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS shelter_pet_details (
                    id VARCHAR PRIMARY KEY,
                    pet_id VARCHAR NOT NULL UNIQUE REFERENCES pets(id) ON DELETE CASCADE,
                    nickname VARCHAR,
                    health_status VARCHAR,
                    coat_type VARCHAR,
                    adoption_status VARCHAR,
                    is_published INTEGER NOT NULL DEFAULT 1,
                    created_at DATETIME,
                    updated_at DATETIME
                )
                """
            )
        )
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_shelter_pet_details_pet_id "
                "ON shelter_pet_details(pet_id)"
            )
        )
        conn.execute(
            text(
                "CREATE INDEX IF NOT EXISTS ix_shelter_pet_details_published "
                "ON shelter_pet_details(is_published)"
            )
        )
        rows = conn.execute(text("PRAGMA table_info(shelter_pet_details)")).fetchall()
        existing_cols = {row[1] for row in rows}
        if "nickname" not in existing_cols:
            conn.execute(text("ALTER TABLE shelter_pet_details ADD COLUMN nickname VARCHAR"))
            logger.warning("Auto-migrated column shelter_pet_details.nickname")
        if "health_status" not in existing_cols:
            conn.execute(text("ALTER TABLE shelter_pet_details ADD COLUMN health_status VARCHAR"))
            logger.warning("Auto-migrated column shelter_pet_details.health_status")
        if "coat_type" not in existing_cols:
            conn.execute(text("ALTER TABLE shelter_pet_details ADD COLUMN coat_type VARCHAR"))
            logger.warning("Auto-migrated column shelter_pet_details.coat_type")
        conn.execute(
            text(
                """
                INSERT INTO shelter_pet_details (
                    id, pet_id, nickname, health_status, coat_type, adoption_status, is_published, created_at, updated_at
                )
                SELECT
                    'spd-' || substr(lower(hex(randomblob(16))), 1, 10),
                    p.id,
                    NULL,
                    NULL,
                    NULL,
                    p.adoption_status,
                    COALESCE(p.is_published, 1),
                    p.published_at,
                    p.updated_at
                FROM pets p
                LEFT JOIN shelter_pet_details d ON d.pet_id = p.id
                WHERE (p.pet_scope = 'shelter_pet') AND d.id IS NULL
                """
            )
        )


def _ensure_shelter_campaigns_table() -> None:
    if not SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
        return
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS shelter_campaigns (
                    id VARCHAR PRIMARY KEY,
                    pet_id VARCHAR NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
                    shelter_id VARCHAR NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
                    title VARCHAR NOT NULL,
                    description TEXT,
                    help_details TEXT,
                    goal_amount INTEGER NOT NULL DEFAULT 0,
                    collected_amount INTEGER NOT NULL DEFAULT 0,
                    status VARCHAR NOT NULL DEFAULT 'draft',
                    starts_at DATETIME,
                    ends_at DATETIME,
                    closed_at DATETIME,
                    close_reason TEXT,
                    created_by_user_id VARCHAR NOT NULL REFERENCES users(id),
                    created_at DATETIME,
                    updated_at DATETIME
                )
                """
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_shelter_campaigns_pet_id ON shelter_campaigns(pet_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_shelter_campaigns_shelter_id ON shelter_campaigns(shelter_id)"))
        rows = conn.execute(text("PRAGMA table_info(shelter_campaigns)")).fetchall()
        existing_cols = {row[1] for row in rows}
        if "help_details" not in existing_cols:
            conn.execute(text("ALTER TABLE shelter_campaigns ADD COLUMN help_details TEXT"))
            logger.warning("Auto-migrated column shelter_campaigns.help_details")
        if "close_reason" not in existing_cols:
            conn.execute(text("ALTER TABLE shelter_campaigns ADD COLUMN close_reason TEXT"))
            logger.warning("Auto-migrated column shelter_campaigns.close_reason")


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

