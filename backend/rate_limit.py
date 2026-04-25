"""Общий limiter для SlowAPI (лимиты по IP)."""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# Глобальный лимит для маршрутов без @limiter.limit (через SlowAPIMiddleware в main).
# Маршруты с собственным @limiter.limit обрабатываются только декоратором (middleware их не трогает).
_default = os.getenv("API_RATE_LIMIT_DEFAULT", "300/minute").strip()
if not _default:
    _default = "300/minute"

limiter = Limiter(key_func=get_remote_address, default_limits=[_default])
