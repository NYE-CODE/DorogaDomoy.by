"""
Миграция: добавляет недостающие колонки в таблицы.
Запуск на проде после деплоя:
    cd /path/to/backend
    python migrate_schema.py
"""
import sqlite3
import sys
from pathlib import Path

from database import _resolve_db_url
from platform_settings import ALL_PLATFORM_SETTINGS_DEFAULTS

# Колонки, которые могут отсутствовать (добавлены после первой версии)
PET_COLUMNS_TO_ADD = [
    ("is_archived", "INTEGER DEFAULT 0"),
    ("archive_reason", "VARCHAR"),
    ("moderation_status", "VARCHAR DEFAULT 'pending'"),
    ("moderation_reason", "VARCHAR"),
    ("moderated_at", "DATETIME"),
    ("moderated_by", "VARCHAR"),
]

USER_COLUMNS_TO_ADD = [
    ("contacts", "JSON DEFAULT '{}'"),
    ("is_blocked", "INTEGER DEFAULT 0"),
    ("blocked_reason", "VARCHAR"),
    ("created_at", "DATETIME"),
    ("telegram_id", "BIGINT"),
    ("telegram_username", "VARCHAR"),
    ("telegram_linked_at", "DATETIME"),
]

PROFILE_PET_COLUMNS_TO_ADD = [
    ("breed", "VARCHAR"),
    ("gender", "VARCHAR DEFAULT 'male'"),
    ("age", "VARCHAR"),
    ("colors", "JSON DEFAULT '[]'"),
    ("special_marks", "TEXT"),
    ("is_chipped", "INTEGER DEFAULT 0"),
    ("chip_number", "VARCHAR"),
    ("medical_info", "TEXT"),
    ("temperament", "VARCHAR"),
    ("responds_to_name", "INTEGER DEFAULT 1"),
    ("favorite_treats", "TEXT"),
    ("favorite_walks", "TEXT"),
    ("photos", "JSON DEFAULT '[]'"),
    ("created_at", "DATETIME"),
    ("updated_at", "DATETIME"),
]

NEW_TABLES = {
    "telegram_link_codes": """
        CREATE TABLE telegram_link_codes (
            id VARCHAR PRIMARY KEY,
            code VARCHAR UNIQUE NOT NULL,
            user_id VARCHAR NOT NULL REFERENCES users(id),
            created_at DATETIME,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0
        )
    """,
    "notification_settings": """
        CREATE TABLE notification_settings (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR UNIQUE NOT NULL REFERENCES users(id),
            notifications_enabled INTEGER DEFAULT 1,
            notification_radius_km REAL DEFAULT 1.0,
            notify_animal_types JSON DEFAULT '["dog","cat","other"]',
            home_lat REAL,
            home_lng REAL,
            created_at DATETIME,
            updated_at DATETIME
        )
    """,
    "notifications": """
        CREATE TABLE notifications (
            id VARCHAR PRIMARY KEY,
            user_id VARCHAR NOT NULL REFERENCES users(id),
            pet_id VARCHAR NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
            type VARCHAR NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            sent_via VARCHAR DEFAULT 'telegram',
            sent_at DATETIME
        )
    """,
    "sightings": """
        CREATE TABLE sightings (
            id VARCHAR PRIMARY KEY,
            pet_id VARCHAR NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
            location_lat REAL NOT NULL,
            location_lng REAL NOT NULL,
            seen_at DATETIME NOT NULL,
            comment TEXT,
            contact VARCHAR,
            reporter_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            ip_hash VARCHAR,
            created_at DATETIME
        )
    """,
    "media_articles": """
        CREATE TABLE media_articles (
            id VARCHAR PRIMARY KEY,
            logo_url VARCHAR,
            title VARCHAR NOT NULL,
            published_at DATETIME NOT NULL,
            link VARCHAR,
            sort_order VARCHAR DEFAULT '0'
        )
    """,
    "partners": """
        CREATE TABLE partners (
            id VARCHAR PRIMARY KEY,
            logo_url VARCHAR,
            name VARCHAR NOT NULL,
            link VARCHAR
        )
    """,
    "faq_items": """
        CREATE TABLE faq_items (
            id VARCHAR PRIMARY KEY,
            question_ru TEXT NOT NULL DEFAULT '',
            question_be TEXT NOT NULL DEFAULT '',
            question_en TEXT NOT NULL DEFAULT '',
            answer_ru TEXT NOT NULL DEFAULT '',
            answer_be TEXT NOT NULL DEFAULT '',
            answer_en TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """,
    "profile_pets": """
        CREATE TABLE profile_pets (
            id VARCHAR PRIMARY KEY,
            owner_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR NOT NULL,
            species VARCHAR NOT NULL,
            breed VARCHAR,
            gender VARCHAR DEFAULT 'male',
            age VARCHAR,
            colors JSON DEFAULT '[]',
            special_marks TEXT,
            is_chipped INTEGER DEFAULT 0,
            chip_number VARCHAR,
            medical_info TEXT,
            temperament VARCHAR,
            responds_to_name INTEGER DEFAULT 1,
            favorite_treats TEXT,
            favorite_walks TEXT,
            photos JSON DEFAULT '[]',
            created_at DATETIME,
            updated_at DATETIME
        )
    """,
    "blog_categories": """
        CREATE TABLE blog_categories (
            id VARCHAR PRIMARY KEY,
            slug VARCHAR UNIQUE NOT NULL,
            title VARCHAR NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME,
            updated_at DATETIME
        )
    """,
    "blog_posts": """
        CREATE TABLE blog_posts (
            id VARCHAR PRIMARY KEY,
            slug VARCHAR UNIQUE NOT NULL,
            title VARCHAR NOT NULL,
            excerpt TEXT,
            body_md TEXT NOT NULL,
            cover_image_url VARCHAR,
            meta_description VARCHAR,
            category VARCHAR DEFAULT 'guides',
            status VARCHAR DEFAULT 'draft',
            published_at DATETIME,
            created_at DATETIME,
            updated_at DATETIME,
            author_id VARCHAR REFERENCES users(id),
            telegram_message_id INTEGER,
            telegram_channel_username VARCHAR
        )
    """,
    "profile_pet_scan_signals": """
        CREATE TABLE profile_pet_scan_signals (
            id VARCHAR PRIMARY KEY,
            profile_pet_id VARCHAR NOT NULL REFERENCES profile_pets(id) ON DELETE CASCADE,
            owner_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reporter_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
            ip_hash VARCHAR,
            source VARCHAR DEFAULT 'unknown',
            telegram_sent INTEGER DEFAULT 0,
            created_at DATETIME
        )
    """,
}


def get_existing_columns(conn, table):
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def resolve_sqlite_db_path() -> Path:
    database_url = _resolve_db_url()
    if not database_url.startswith("sqlite:///"):
        raise RuntimeError("migrate_schema.py currently supports only sqlite DATABASE_URL")
    return Path(database_url.replace("sqlite:///", "")).resolve()


def migrate(conn):
    changes = []
    for table, col_defs in [
        ("pets", PET_COLUMNS_TO_ADD),
        ("users", USER_COLUMNS_TO_ADD),
        ("profile_pets", PROFILE_PET_COLUMNS_TO_ADD),
    ]:
        try:
            existing = get_existing_columns(conn, table)
        except sqlite3.OperationalError:
            print(f"Table {table} does not exist, skipping")
            continue
        for col_name, col_type in col_defs:
            if col_name not in existing:
                try:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")
                    changes.append(f"{table}.{col_name}")
                except sqlite3.OperationalError as e:
                    print(f"Warning: could not add {table}.{col_name}: {e}")
    return changes


def ensure_new_tables(conn):
    """Create new tables if they don't exist."""
    for table_name, ddl in NEW_TABLES.items():
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,),
        )
        if not cur.fetchone():
            conn.execute(ddl)
            print(f"Created table: {table_name}")


def seed_blog_categories(conn):
    """Начальные категории блога (если таблица пуста), чтобы slug-и совпадали со старыми постами."""
    try:
        cur = conn.execute("SELECT 1 FROM blog_categories LIMIT 1")
        if cur.fetchone():
            return
    except sqlite3.OperationalError:
        return
    from datetime import datetime

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    seed_rows = [
        ("bc-guides", "guides", "Советы", 0),
        ("bc-stories", "stories", "Истории", 1),
        ("bc-news", "news", "Новости", 2),
        ("bc-safety", "safety", "Безопасность", 3),
    ]
    for sid, slug, title, so in seed_rows:
        conn.execute(
            "INSERT INTO blog_categories (id, slug, title, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (sid, slug, title, so, now, now),
        )
    print("Seeded blog_categories (defaults)")


def ensure_platform_settings(conn):
    """Убедиться, что таблица platform_settings существует и содержит нужные ключи."""
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='platform_settings'"
    )
    if not cur.fetchone():
        conn.execute("""
            CREATE TABLE platform_settings (
                key VARCHAR PRIMARY KEY,
                value VARCHAR NOT NULL
            )
        """)
        print("Created platform_settings table")
    defaults = list(ALL_PLATFORM_SETTINGS_DEFAULTS.items())
    for key, value in defaults:
        cur = conn.execute("SELECT 1 FROM platform_settings WHERE key = ?", (key,))
        if cur.fetchone() is None:
            conn.execute("INSERT INTO platform_settings (key, value) VALUES (?, ?)", (key, value))
            print(f"Added platform_settings: {key}={value}")


PERFORMANCE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS ix_pets_author_id ON pets (author_id)",
    "CREATE INDEX IF NOT EXISTS ix_pets_status ON pets (status)",
    (
        "CREATE INDEX IF NOT EXISTS ix_pets_moderation_archived_published "
        "ON pets (moderation_status, is_archived, published_at DESC)"
    ),
    "CREATE INDEX IF NOT EXISTS ix_pets_animal_type ON pets (animal_type)",
    "CREATE INDEX IF NOT EXISTS ix_blog_posts_status_published ON blog_posts (status, published_at DESC)",
    "CREATE INDEX IF NOT EXISTS ix_reports_status ON reports (status)",
    "CREATE INDEX IF NOT EXISTS ix_reports_created_at ON reports (created_at DESC)",
    "CREATE INDEX IF NOT EXISTS ix_reports_pet_id ON reports (pet_id)",
    (
        "CREATE INDEX IF NOT EXISTS ix_notifications_user_pet "
        "ON notifications (user_id, pet_id)"
    ),
    (
        "CREATE INDEX IF NOT EXISTS ix_sightings_pet_reporter_created "
        "ON sightings (pet_id, reporter_id, created_at)"
    ),
    (
        "CREATE INDEX IF NOT EXISTS ix_sightings_pet_ip_created "
        "ON sightings (pet_id, ip_hash, created_at)"
    ),
]


def ensure_performance_indexes(conn):
    """Идемпотентные индексы под частые фильтры (SQLite)."""
    for ddl in PERFORMANCE_INDEXES:
        try:
            conn.execute(ddl)
        except sqlite3.OperationalError as e:
            print(f"Warning: index skipped: {e}")


if __name__ == "__main__":
    db_path = resolve_sqlite_db_path()
    if not db_path.exists():
        print(f"Database not found: {db_path}", file=sys.stderr)
        sys.exit(1)
    print(f"Using database: {db_path}")
    conn = sqlite3.connect(db_path)
    try:
        changes = migrate(conn)
        ensure_new_tables(conn)
        seed_blog_categories(conn)
        ensure_platform_settings(conn)
        ensure_performance_indexes(conn)
        conn.commit()
        if changes:
            print("Added columns:", ", ".join(changes))
        else:
            print("No schema changes needed.")
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        conn.close()
