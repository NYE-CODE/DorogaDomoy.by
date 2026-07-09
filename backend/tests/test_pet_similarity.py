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


def test_description_overlap():
    from types import SimpleNamespace
    from pet_similarity import _description_overlap_score

    a = SimpleNamespace(description="рыжий кот с белой грудкой и пятном на ухе")
    b = SimpleNamespace(description="белое пятно на ухе рыжий окрас")
    assert _description_overlap_score(a, b) > 0.15


def test_match_percent_breed_outweighs_color_only():
    from types import SimpleNamespace
    from pet_similarity import _compute_match_percent

    source = SimpleNamespace(
        breed="Немецкая овчарка",
        colors=["black"],
        gender="male",
        approximate_age="",
        description="",
        city="Минск",
        location_lat=None,
        location_lng=None,
    )
    same_breed = SimpleNamespace(
        breed="немецкая овчарка",
        colors=["white"],
        gender="male",
        approximate_age="",
        description="",
        city="Минск",
        location_lat=None,
        location_lng=None,
    )
    color_only = SimpleNamespace(
        breed="Дворняжка",
        colors=["black"],
        gender="male",
        approximate_age="",
        description="",
        city="Минск",
        location_lat=None,
        location_lng=None,
    )

    from breed_catalog import breed_similarity, color_similarity

    breed_pct = _compute_match_percent(
        source,
        same_breed,
        breed_sim=breed_similarity(source.breed, same_breed.breed),
        color_sim=color_similarity(source.colors, same_breed.colors),
        visual=0.0,
        distance_km=3.0,
        radius_km=15.0,
        desc_overlap=0.0,
    )
    color_pct = _compute_match_percent(
        source,
        color_only,
        breed_sim=breed_similarity(source.breed, color_only.breed),
        color_sim=color_similarity(source.colors, color_only.colors),
        visual=0.0,
        distance_km=3.0,
        radius_km=15.0,
        desc_overlap=0.0,
    )
    assert breed_pct > color_pct
