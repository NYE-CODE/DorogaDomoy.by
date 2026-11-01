"""Служебные письма: регистрация и сброс пароля. SMTP, без очереди."""
from __future__ import annotations

import html
import logging
import os
import smtplib
import ssl
import threading
from email.message import EmailMessage
from email.utils import formataddr

from telegram_login import is_internal_email

logger = logging.getLogger(__name__)

def _site_url() -> str:
    return (os.getenv("SITE_URL") or "https://dorogadomoy.by").rstrip("/")


def _contact_email() -> str:
    return (os.getenv("CONTACT_EMAIL") or "contact@dorogadomoy.by").strip()
_ROLE_LABELS = {
    "user": "Пользователь",
    "volunteer": "Волонтёр",
    "admin": "Администратор",
}


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip()


def smtp_configured() -> bool:
    return bool(_env("SMTP_HOST") and _env("SMTP_USER") and _env("SMTP_PASSWORD") and _env("SMTP_FROM"))


def is_deliverable_mailbox(email: str | None) -> bool:
    value = (email or "").strip()
    if "@" not in value or is_internal_email(value):
        return False
    local, _, domain = value.partition("@")
    return bool(local) and "." in domain


def can_email_password_reset(*, email: str | None, password_set: bool) -> bool:
    """Ссылка сброса уходит только на настоящий email, если пароль уже задан."""
    return bool(password_set) and is_deliverable_mailbox(email)


def send_email(*, to: str, subject: str, text: str, html_body: str | None = None) -> bool:
    if not smtp_configured():
        logger.warning("SMTP is not configured, skipping email")
        return False
    recipient = (to or "").strip()
    if not is_deliverable_mailbox(recipient):
        logger.warning("Refusing email to a non-deliverable address")
        return False

    host = _env("SMTP_HOST")
    port = int(_env("SMTP_PORT") or "465")
    user = _env("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD") or ""
    sender = _env("SMTP_FROM")
    timeout = float(_env("SMTP_TIMEOUT") or "15")

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr(("DorogaDomoy.by", sender))
    message["To"] = recipient
    message["Reply-To"] = _contact_email()
    message.set_content(text)
    if html_body:
        message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()
    try:
        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=timeout, context=context) as smtp:
                smtp.login(user, password)
                smtp.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=timeout) as smtp:
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
                smtp.login(user, password)
                smtp.send_message(message)
    except Exception:
        domain = recipient.partition("@")[2] or "unknown"
        logger.exception("Failed to send email subject=%r domain=%s", subject, domain)
        return False

    domain = recipient.partition("@")[2] or "unknown"
    logger.info("Email sent subject=%r domain=%s", subject, domain)
    return True


def enqueue_email(*, to: str, subject: str, text: str, html_body: str | None = None) -> None:
    """Не задерживает ответ API. Ошибка доставки пишется в лог и не откатывает запрос."""
    if not smtp_configured():
        logger.warning("SMTP is not configured; email %r was not sent", subject)
        return
    kwargs = {"to": to, "subject": subject, "text": text, "html_body": html_body}
    inline = _env("SMTP_INLINE").lower() in {"1", "true", "yes"}
    if inline:
        send_email(**kwargs)
        return
    threading.Thread(target=send_email, kwargs=kwargs, daemon=True, name="smtp-send").start()


def _role_label(role: str | None) -> str:
    key = (role or "user").strip().lower()
    return _ROLE_LABELS.get(key, _ROLE_LABELS["user"])


def build_registration_email(*, name: str, email: str, role: str | None) -> tuple[str, str, str]:
    safe_name = (name or "").strip() or "друг"
    role_label = _role_label(role)
    site = _site_url()
    contact = _contact_email()
    profile = f"{site}/profile"
    create = f"{site}/create"
    subject = "Регистрация на DorogaDomoy.by"
    text = (
        f"Здравствуйте, {safe_name}.\n\n"
        "Вы зарегистрировались на DorogaDomoy.by.\n\n"
        f"Имя: {safe_name}\n"
        f"Email: {email}\n"
        f"Роль: {role_label}\n\n"
        f"Сайт: {site}\n"
        f"Профиль: {profile}\n"
        f"Создать объявление: {create}\n\n"
        f"Если это были не вы, напишите на {contact}.\n"
    )
    html_body = (
        "<p>Здравствуйте, {name}.</p>"
        "<p>Вы зарегистрировались на DorogaDomoy.by.</p>"
        "<ul>"
        "<li>Имя: {name}</li>"
        "<li>Email: {email}</li>"
        "<li>Роль: {role}</li>"
        "</ul>"
        '<p><a href="{site}">Открыть сайт</a></p>'
        '<p><a href="{profile}">Профиль</a></p>'
        '<p><a href="{create}">Создать объявление</a></p>'
        "<p>Если это были не вы, напишите на "
        '<a href="mailto:{contact}">{contact}</a>.</p>'
    ).format(
        name=html.escape(safe_name),
        email=html.escape(email),
        role=html.escape(role_label),
        site=html.escape(site, quote=True),
        profile=html.escape(profile, quote=True),
        create=html.escape(create, quote=True),
        contact=html.escape(contact),
    )
    return subject, text, html_body


def build_password_reset_email(reset_url: str) -> tuple[str, str, str]:
    subject = "Сброс пароля на DorogaDomoy.by"
    text = (
        "Вы запросили сброс пароля на DorogaDomoy.by.\n\n"
        f"Задать новый пароль: {reset_url}\n\n"
        "Ссылка действует 30 минут и сработает один раз.\n"
        "Если это были не вы, проигнорируйте письмо. Пароль не изменится.\n"
    )
    html_body = (
        "<p>Вы запросили сброс пароля на DorogaDomoy.by.</p>"
        '<p><a href="{url}">Задать новый пароль</a></p>'
        "<p>Ссылка действует 30 минут и сработает один раз.</p>"
        "<p>Если это были не вы, проигнорируйте письмо. Пароль не изменится.</p>"
    ).format(url=html.escape(reset_url, quote=True))
    return subject, text, html_body


def enqueue_registration_email(*, to: str, name: str, role: str | None) -> None:
    subject, text, html_body = build_registration_email(name=name, email=to, role=role)
    enqueue_email(to=to, subject=subject, text=text, html_body=html_body)


def enqueue_password_reset_email(*, to: str, reset_url: str) -> None:
    subject, text, html_body = build_password_reset_email(reset_url)
    enqueue_email(to=to, subject=subject, text=text, html_body=html_body)
