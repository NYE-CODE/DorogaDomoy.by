"""
Фасад уведомлений Telegram.

Роутеры импортируют отсюда, а не из telegram_bot напрямую — проще тестировать
и менять реализацию.
"""
from __future__ import annotations

from telegram_bot import (
    notify_author_pet_moderation_sync,
    publish_blog_post_to_telegram,
    send_pending_moderation_alert_sync,
    send_notifications_for_pet,
    send_profile_pet_signal_sync,
    send_sighting_notification_sync,
)

__all__ = [
    "notify_author_pet_moderation_sync",
    "publish_blog_post_to_telegram",
    "send_pending_moderation_alert_sync",
    "send_notifications_for_pet",
    "send_profile_pet_signal_sync",
    "send_sighting_notification_sync",
]
