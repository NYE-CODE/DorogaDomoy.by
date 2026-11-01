"""Письма регистрации и сброса пароля."""
from unittest.mock import MagicMock, patch

from mailer import (
    build_password_reset_email,
    build_registration_email,
    is_deliverable_mailbox,
    can_email_password_reset,
    send_email,
)


def test_internal_telegram_mailbox_is_not_deliverable():
    assert is_deliverable_mailbox("tg1@telegram.local") is False
    assert is_deliverable_mailbox("name@example.by") is True
    assert is_deliverable_mailbox("not-an-email") is False


def test_password_reset_is_email_only():
    assert can_email_password_reset(email="a@b.by", password_set=True) is True
    assert can_email_password_reset(email="tg1@telegram.local", password_set=True) is False
    assert can_email_password_reset(email="a@b.by", password_set=False) is False


def test_registration_letter_lists_account_and_hides_markup():
    subject, text, html_body = build_registration_email(
        name='<Анна>',
        email="anna@example.by",
        role="volunteer",
    )
    assert subject.startswith("Регистрация")
    assert "anna@example.by" in text
    assert "Волонтёр" in text
    assert "<Анна>" not in html_body
    assert "&lt;Анна&gt;" in html_body
    assert "secret-password" not in text
    assert "secret-password" not in html_body


def test_reset_letter_contains_link_once():
    url = "https://dorogadomoy.by/reset-password?token=abc"
    _subject, text, html_body = build_password_reset_email(url)
    assert text.count(url) == 1
    assert "30 минут" in text
    assert "token=abc" in html_body


def test_send_email_uses_ssl_on_port_465(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "mail.example")
    monkeypatch.setenv("SMTP_PORT", "465")
    monkeypatch.setenv("SMTP_USER", "noreply@example.by")
    monkeypatch.setenv("SMTP_PASSWORD", "secret")
    monkeypatch.setenv("SMTP_FROM", "noreply@example.by")
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    with patch("mailer.smtplib.SMTP_SSL", return_value=smtp) as ctor:
        ok = send_email(to="a@example.by", subject="Тема", text="Текст", html_body="<p>Текст</p>")
    assert ok is True
    ctor.assert_called_once()
    assert ctor.call_args.args[:2] == ("mail.example", 465)
    smtp.login.assert_called_once_with("noreply@example.by", "secret")
    smtp.send_message.assert_called_once()


def test_send_email_skips_when_unconfigured(monkeypatch):
    monkeypatch.delenv("SMTP_HOST", raising=False)
    monkeypatch.delenv("SMTP_USER", raising=False)
    monkeypatch.delenv("SMTP_PASSWORD", raising=False)
    monkeypatch.delenv("SMTP_FROM", raising=False)
    assert send_email(to="a@example.by", subject="s", text="t") is False
