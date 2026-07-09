"""Тесты отличительных примет."""
from distinctive_marks import marks_overlap_score, normalize_distinctive_marks


def test_normalize_distinctive_marks_dedupes_and_limits():
    raw = [
        "белая грудка",
        "Белая грудка",
        "хромает",
        "ab",
        "x" * 90,
    ]
    out = normalize_distinctive_marks(raw)
    assert out == ["белая грудка", "хромает"]


def test_marks_overlap_finds_phrase_match():
    score, matched = marks_overlap_score(
        ["белая грудка", "обрезан хвост"],
        ["грудка белого цвета", "рыжий окрас"],
    )
    assert score > 0
    assert "белая грудка" in matched


def test_marks_overlap_empty_lists():
    assert marks_overlap_score([], ["белая грудка"]) == (0.0, [])
