"""Тесты API настроек уведомлений."""
from schemas import NotificationSettingsResponse, NotificationSettingsUpdate


def test_notification_settings_response_includes_similar_matches():
    data = NotificationSettingsResponse(
        notifications_enabled=True,
        notification_radius_km=3.0,
        notify_similar_matches=False,
    )
    assert data.notify_similar_matches is False


def test_notification_settings_update_accepts_similar_matches():
    patch = NotificationSettingsUpdate(notify_similar_matches=True)
    assert patch.notify_similar_matches is True
