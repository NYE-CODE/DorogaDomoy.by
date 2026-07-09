"""Тесты публичного формата 422 validation detail."""
from main import _public_validation_detail


def test_public_validation_detail_strips_value_error_prefix():
    errors = [
        {
            "type": "value_error",
            "loc": ("body", "description"),
            "msg": "Value error, Описание должно быть не короче 20 символов",
            "input": "x",
        }
    ]
    out = _public_validation_detail(errors)
    assert out == [
        {"field": "description", "msg": "Описание должно быть не короче 20 символов"}
    ]


def test_public_validation_detail_keeps_plain_msg():
    errors = [{"loc": ("body", "city"), "msg": "Field required"}]
    out = _public_validation_detail(errors)
    assert out[0]["field"] == "city"
    assert out[0]["msg"] == "Field required"
