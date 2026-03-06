"""One-time migration: recreate reports table with ON DELETE CASCADE FK.

Run on the production server after deploying:
    cd /path/to/backend
    python migrate_fk.py
"""
import sqlite3
import sys

DB_PATH = "petfinder.db"


def needs_migration(conn):
    row = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='reports'"
    ).fetchone()
    if not row or not row[0]:
        return False
    return "ON DELETE CASCADE" not in row[0].upper()


def migrate(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA foreign_keys=OFF")
    cur.execute("BEGIN TRANSACTION")
    try:
        cur.execute("""
            CREATE TABLE reports_new (
                id VARCHAR NOT NULL,
                pet_id VARCHAR NOT NULL,
                reporter_id VARCHAR NOT NULL,
                reporter_name VARCHAR NOT NULL,
                reason VARCHAR NOT NULL,
                description TEXT NOT NULL,
                created_at DATETIME,
                status VARCHAR,
                reviewed_by VARCHAR,
                reviewed_at DATETIME,
                resolution TEXT,
                PRIMARY KEY (id),
                FOREIGN KEY(pet_id) REFERENCES pets (id) ON DELETE CASCADE,
                FOREIGN KEY(reporter_id) REFERENCES users (id)
            )
        """)
        cur.execute("INSERT INTO reports_new SELECT * FROM reports")
        cur.execute("DROP TABLE reports")
        cur.execute("ALTER TABLE reports_new RENAME TO reports")
        cur.execute("CREATE INDEX IF NOT EXISTS ix_reports_id ON reports (id)")
        conn.commit()
        print("OK: reports table now has ON DELETE CASCADE.")
    except Exception as e:
        conn.rollback()
        print(f"FAILED: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        cur.execute("PRAGMA foreign_keys=ON")


if __name__ == "__main__":
    conn = sqlite3.connect(DB_PATH)
    if not needs_migration(conn):
        print("No migration needed.")
    else:
        count = conn.execute("SELECT COUNT(*) FROM reports").fetchone()[0]
        print(f"Migrating {count} report(s)...")
        migrate(conn)
    conn.close()
