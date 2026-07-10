"""Меню бота для привязанных Telegram-пользователей."""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from telegram_bot import (
    SITE_URL,
    handle_menu_command,
    handle_start_command,
    linked_user_menu_keyboard,
)


def test_linked_user_menu_keyboard_urls():
    kb = linked_user_menu_keyboard()
    urls = [btn["url"] for row in kb["inline_keyboard"] for btn in row]
    assert f"{SITE_URL}/my-ads" in urls
    assert f"{SITE_URL}/favorites" in urls
    assert f"{SITE_URL}/my-pets" in urls


def test_handle_start_command_linked_user():
    user = SimpleNamespace(name="Анна", is_blocked=False)
    db = MagicMock()
    db.scalar.return_value = user

    with patch("telegram_bot.SessionLocal", return_value=db):
        text, keyboard = handle_start_command(12345)

    assert "Анна" in text
    assert keyboard is not None
    assert "inline_keyboard" in keyboard


def test_handle_start_command_guest():
    db = MagicMock()
    db.scalar.return_value = None

    with patch("telegram_bot.SessionLocal", return_value=db):
        text, keyboard = handle_start_command(99999)

    assert "/link" in text
    assert keyboard is None


def test_handle_menu_command_linked_user():
    user = SimpleNamespace(name="Иван", is_blocked=False)
    db = MagicMock()
    db.scalar.return_value = user

    with patch("telegram_bot.SessionLocal", return_value=db):
        text, keyboard = handle_menu_command(12345)

    assert "Выберите" in text
    assert keyboard is not None


def test_handle_menu_command_guest():
    db = MagicMock()
    db.scalar.return_value = None

    with patch("telegram_bot.SessionLocal", return_value=db):
        text, keyboard = handle_menu_command(99999)

    assert "/link" in text
    assert keyboard is None
