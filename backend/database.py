"""SQLAlchemy database setup with SQLite."""
import os
import logging
from pathlib import Path

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./petfinder.db",
)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
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
    """Create all tables."""
    import models  # noqa: F401 - registers ORM models
    Base.metadata.create_all(bind=engine)
    logger.info("Database URL: %s", SQLALCHEMY_DATABASE_URL)


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
