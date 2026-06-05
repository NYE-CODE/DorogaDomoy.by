"""Общий limiter для SlowAPI (лимиты по IP клиента, с учётом reverse proxy)."""
import ipaddress
import os

from fastapi import Request
from slowapi import Limiter

# Глобальный лимит для маршрутов без @limiter.limit (через SlowAPIMiddleware в main).
_default = os.getenv("API_RATE_LIMIT_DEFAULT", "600/minute").strip() or "600/minute"

TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").lower() in {"1", "true", "yes", "on"}


def _trusted_proxy_peers() -> frozenset[str]:
    raw = os.getenv("TRUSTED_PROXY_IPS", "127.0.0.1,::1").strip()
    return frozenset(p.strip() for p in raw.split(",") if p.strip())


def _peer_is_trusted_proxy(request: Request) -> bool:
    """Заголовки X-Real-IP / X-Forwarded-For доверяем только от reverse proxy."""
    if not request.client or not request.client.host:
        return False
    peer = request.client.host.strip()
    if peer in _trusted_proxy_peers():
        return True
    try:
        return ipaddress.ip_address(peer).is_loopback
    except ValueError:
        return False


def _normalize_client_ip(raw: str) -> str | None:
    candidate = raw.strip()
    if not candidate:
        return None
    try:
        return str(ipaddress.ip_address(candidate))
    except ValueError:
        return None


def get_client_ip(request: Request) -> str:
    """
    IP для rate limit. За nginx без TRUST_PROXY_HEADERS=true все пользователи
    попадают в один bucket (127.0.0.1) и быстро получают 429.
    """
    if TRUST_PROXY_HEADERS and _peer_is_trusted_proxy(request):
        real_ip = _normalize_client_ip(request.headers.get("X-Real-IP") or "")
        if real_ip:
            return real_ip
        forwarded = (request.headers.get("X-Forwarded-For") or "").strip()
        if forwarded:
            first = _normalize_client_ip(forwarded.split(",")[0])
            if first:
                return first
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


limiter = Limiter(key_func=get_client_ip, default_limits=[_default])
