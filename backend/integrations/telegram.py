"""
Фасад уведомлений Telegram.

Роутеры импортируют отсюда, а не из telegram_bot напрямую — проще тестировать
и менять реализацию.
"""
from __future__ import annotations

from telegram_bot import (
    publish_blog_post_to_telegram,
    send_notifications_for_pet,
    send_profile_pet_signal_sync,
    send_sighting_notification_sync,
)

__all__ = [
    "publish_blog_post_to_telegram",
    "send_notifications_for_pet",
    "send_profile_pet_signal_sync",
    "send_sighting_notification_sync",
]
