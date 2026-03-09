#!/usr/bin/env python3
"""
Диагностика: проверка записи в БД.
Запускать на сервере от того же пользователя, от которого стартует backend:
  sudo -u www-data python3 check_permissions.py
или просто: python3 check_permissions.py
"""
import os
import sqlite3
from pathlib import Path

url = os.getenv("DATABASE_URL", "sqlite:///./petfinder.db")
path = url.replace("sqlite:///", "")
if path.startswith("/"):
    path = path
elif path.startswith("./") or not os.path.isabs(path):
    path = str(Path(__file__).resolve().parent / path.replace("./", "").strip("/"))
path = os.path.abspath(path)

print("DATABASE_URL:", os.getenv("DATABASE_URL", "(not set)"))
print("Resolved path:", path)
print("File exists:", os.path.exists(path))
print("Parent dir:", os.path.dirname(path))
print("Parent writable:", os.access(os.path.dirname(path), os.W_OK))
print("File writable:", os.access(path, os.W_OK) if os.path.exists(path) else "N/A")
print("Current user:", os.getuid() if hasattr(os, "getuid") else "?", os.getenv("USER", "?"))

try:
    conn = sqlite3.connect(path)
    conn.execute("CREATE TABLE IF NOT EXISTS _test (id INTEGER PRIMARY KEY)")
    conn.execute("INSERT INTO _test (id) VALUES (1)")
    conn.commit()
    conn.execute("DROP TABLE _test")
    conn.commit()
    conn.close()
    print("Result: WRITE OK")
except Exception as e:
    print("Result: FAILED -", e)
