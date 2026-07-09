"""Тесты скоринга похожих объявлений."""
from breed_catalog import breed_similarity, color_similarity, match_breed_to_catalog


def test_breed_exact_match():
    assert breed_similarity("Немецкая овчарка", "немецкая овчарка") == 1.0


def test_breed_mismatch():
    assert breed_similarity("Немецкая овчарка", "Сибирская лайка") == 0.0
    assert breed_similarity("Немецкая овчарка", "Немецкий шпиц") == 0.0


def test_breed_catalog_german_shepherd():
    assert match_breed_to_catalog("german shepherd", "dog") == "Немецкая овчарка"


def test_color_overlap():
    assert color_similarity(["black", "brown"], ["black"]) > 0.3
    assert color_similarity(["black"], ["white"]) == 0.0
