"""Нормализация и проверка белорусских мобильных номеров (+375, коды 25, 29, 33, 44)."""
import re
from typing import Optional

_BY_MOBILE_NSN = re.compile(r"^(25|29|33|44)\d{7}$")


def _digits_only(s: str) -> str:
    return re.sub(r"\D", "", s)


def parse_belarus_mobile_digits(raw: Optional[object]) -> Optional[str]:
    if raw is None:
        return None
    d = _digits_only(str(raw).strip())
    if not d:
        return None
    if d.startswith("375"):
        if len(d) == 12 and _BY_MOBILE_NSN.match(d[3:]):
            return d
        return None
    if d.startswith("80") and len(d) == 11:
        d = "375" + d[2:]
        if len(d) == 12 and _BY_MOBILE_NSN.match(d[3:]):
            return d
        return None
    if d.startswith("0") and len(d) == 10:
        d = "375" + d[1:]
        if len(d) == 12 and _BY_MOBILE_NSN.match(d[3:]):
            return d
        return None
    if len(d) == 9 and _BY_MOBILE_NSN.match(d):
        return "375" + d
    return None


def format_belarus_phone_storage(raw: Optional[object]) -> Optional[str]:
    parsed = parse_belarus_mobile_digits(raw)
    return f"+{parsed}" if parsed else None
