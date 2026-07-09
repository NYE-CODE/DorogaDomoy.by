"""Smoke-test публичных GET /api/v1 (локально: uvicorn должен быть запущен или TestClient)."""
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))
# Только для изолированного smoke-теста; на проде не используется.
os.environ.setdefault("SECRET_KEY", "local-smoke-test-only-do-not-use-in-prod")

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PUBLIC_GETS = [
    "/api/v1/feature-flags",
    "/api/v1/faq",
    "/api/v1/settings",
    "/api/v1/partners",
    "/api/v1/media",
    "/api/v1/guides/categories",
    "/api/v1/guides/videos",
    "/api/v1/blog/categories",
    "/api/v1/blog/posts",
    "/api/v1/help",
    "/api/v1/shelters?limit=5",
    "/api/v1/pets?limit=5",
    "/api/v1/pets?moderation_status=approved&is_archived=false&limit=5",
    "/api/v1/pets/statistics",
    "/api/v1/shelter-pets/catalog?limit=5",
    "/api/v1/auth/config",
]


def main() -> int:
    failed = []
    for path in PUBLIC_GETS:
        r = client.get(path)
        ok = r.status_code < 400
        status = "OK" if ok else "FAIL"
        print(f"{status} {r.status_code} {path}")
        if not ok:
            failed.append((path, r.status_code, r.text[:300]))
    if failed:
        print("\n--- failures ---")
        for path, code, body in failed:
            print(path, code, body)
        return 1
    print(f"\nAll {len(PUBLIC_GETS)} checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
