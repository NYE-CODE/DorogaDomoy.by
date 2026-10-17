"""Статистика лендинга: happy-archive и скоуп."""
from schemas import ARCHIVE_HAPPY_KEYWORDS, _is_happy_archive


def test_happy_archive_matches_all_locales():
    assert _is_happy_archive("Питомец вернулся домой / найден хозяин")
    assert _is_happy_archive("Питомец пристроен в новую семью")
    assert _is_happy_archive("Питомец передан в приют")
    assert _is_happy_archive("Жывёла вярнулася дадому / знойдзены гаспадар")
    assert _is_happy_archive("Жывёла ўладкавана ў новую сям'ю")
    assert _is_happy_archive("Pet returned home / owner found")
    assert _is_happy_archive("Pet rehomed to a new family")
    assert _is_happy_archive("Pet transferred to shelter")
    assert not _is_happy_archive("listing_expired")
    assert not _is_happy_archive(None)
    assert all(isinstance(kw, str) and kw for kw in ARCHIVE_HAPPY_KEYWORDS)
