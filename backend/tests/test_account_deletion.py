"""Маршрут самоудаления аккаунта."""
import os

os.environ.setdefault("SECRET_KEY", "unit-test-secret-key-for-account-deletion")

from account_deletion import delete_user_account, _delete_owned_shelters
from routers import auth as auth_mod


def test_delete_me_route_is_registered():
    found = False
    for route in auth_mod.router.routes:
        methods = getattr(route, "methods", None) or set()
        path = getattr(route, "path", "")
        if path == "/me" and "DELETE" in {m.upper() for m in methods}:
            found = True
            break
        endpoint = getattr(route, "endpoint", None)
        if getattr(endpoint, "__name__", "") == "delete_me":
            found = True
            break
    assert found, "DELETE /auth/me is not registered"
    assert auth_mod.delete_me.__name__ == "delete_me"


def test_delete_user_account_is_callable():
    assert callable(delete_user_account)
    assert callable(_delete_owned_shelters)
