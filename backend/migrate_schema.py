"""
Миграция: добавляет недостающие колонки в таблицы.
Запуск на проде после деплоя:
    cd /path/to/backend
    python migrate_schema.py
"""
import os
import sqlite3
import sys

DB_PATH = os.getenv("DATABASE_PATH", "petfinder.db")

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
}


def get_existing_columns(conn, table):
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def migrate(conn):
    changes = []
    for table, col_defs in [
        ("pets", PET_COLUMNS_TO_ADD),
        ("users", USER_COLUMNS_TO_ADD),
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
    defaults = [
        ("require_moderation", "true"),
        ("max_photos", "10"),
        ("auto_archive_days", "365"),
    ]
    for key, value in defaults:
        cur = conn.execute("SELECT 1 FROM platform_settings WHERE key = ?", (key,))
        if cur.fetchone() is None:
            conn.execute("INSERT INTO platform_settings (key, value) VALUES (?, ?)", (key, value))
            print(f"Added platform_settings: {key}={value}")


if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print(f"Database not found: {DB_PATH}", file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    try:
        changes = migrate(conn)
        ensure_new_tables(conn)
        ensure_platform_settings(conn)
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
