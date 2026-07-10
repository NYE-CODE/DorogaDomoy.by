"""Тесты агрегации Groq и мульти-эмбеддингов."""
from integrations.photo_analyze_batch import merge_analyze_results
from integrations.photo_embedding_utils import max_visual_similarity, parse_photo_embeddings


def test_merge_analyze_collects_distinctive_marks():
    merged = merge_analyze_results(
        [
            {
                "ai_available": True,
                "animal_type": "dog",
                "distinctive_marks": ["белая грудка"],
            },
            {
                "ai_available": True,
                "animal_type": "dog",
                "distinctive_marks": ["белая грудка", "хромает"],
            },
        ]
    )
    assert "белая грудка" in merged["distinctive_marks"]
    assert "хромает" in merged["distinctive_marks"]


def test_merge_analyze_majority_animal_type():
    merged = merge_analyze_results(
        [
            {"ai_available": True, "animal_type": "dog", "breed": "овчарка", "colors": ["black"]},
            {"ai_available": True, "animal_type": "dog", "breed": "немецкая овчарка", "colors": ["brown"]},
            {"ai_available": True, "animal_type": "cat", "colors": ["white"]},
        ]
    )
    assert merged["ai_available"] is True
    assert merged["animal_type"] == "dog"
    assert "black" in merged["colors"]
    assert "brown" in merged["colors"]


def test_merge_analyze_all_failed_returns_error():
    merged = merge_analyze_results(
        [
            {"ai_available": False, "colors": [], "error": "photo_unclear"},
            {"ai_available": False, "colors": [], "error": "not_animal"},
        ]
    )
    assert merged["ai_available"] is False
    assert merged["error"] in {"photo_unclear", "not_animal", "analyze_failed"}


def test_parse_legacy_single_embedding_vector():
    vec = [1.0, 0.0, 0.5]
    parsed = parse_photo_embeddings(vec)
    assert len(parsed) == 1
    assert parsed[0] == vec


def test_parse_multi_embedding_vectors():
    parsed = parse_photo_embeddings([[1.0, 0.0], [0.0, 1.0]])
    assert len(parsed) == 2


def test_max_visual_similarity_picks_best_pair():
    # Orthogonal unit vectors: sim 0; identical: sim 1
    source = [[1.0, 0.0], [0.0, 1.0]]
    candidate = [[1.0, 0.0], [0.0, 0.0]]
    assert max_visual_similarity(source, candidate) == 1.0

    legacy_source = [1.0, 0.0]
    legacy_candidate = [1.0, 0.0]
    assert max_visual_similarity(legacy_source, legacy_candidate) == 1.0
