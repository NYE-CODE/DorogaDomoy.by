"""Сравнение схем двух баз данных SQLite."""
import sqlite3
import sys

def get_schema(db_path):
    conn = sqlite3.connect(db_path)
    tables = {}
    for (name,) in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall():
        cols = conn.execute(f"PRAGMA table_info({name})").fetchall()
        tables[name] = {row[1]: row[2] for row in cols}
    conn.close()
    return tables

def main():
    db1 = "petfinder.db"
    db2 = "petfinder2.db"
    if len(sys.argv) >= 2:
        db1 = sys.argv[1]
    if len(sys.argv) >= 3:
        db2 = sys.argv[2]

    s1 = get_schema(db1)
    s2 = get_schema(db2)

    print(f"=== {db1} (etalon) ===\n")
    for t in sorted(s1.keys()):
        print(f"  {t}: {list(s1[t].keys())}")
    print()

    print(f"=== {db2} ===\n")
    for t in sorted(s2.keys()):
        print(f"  {t}: {list(s2[t].keys())}")
    print()

    print("=== Chego ne hvataet v petfinder2.db ===\n")
    t1 = set(s1.keys())
    t2 = set(s2.keys())
    only_in_1 = t1 - t2
    if only_in_1:
        print(f"Tablicy (est v {db1}, net v {db2}):")
        for t in sorted(only_in_1):
            print(f"  - {t}")
        print()

    for table in sorted(t1 & t2):
        c1 = set(s1[table].keys())
        c2 = set(s2[table].keys())
        missing_in_2 = c1 - c2
        if missing_in_2:
            print(f"{table}: net kolonok: {sorted(missing_in_2)}")

if __name__ == "__main__":
    main()
