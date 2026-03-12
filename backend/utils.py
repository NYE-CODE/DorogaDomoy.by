"""Shared utilities for routers."""
from models import User
from schemas import UserResponse


def user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        role=user.role,
        contacts=user.contacts or {},
        is_blocked=user.is_blocked,
        blocked_reason=user.blocked_reason,
        telegram_id=user.telegram_id,
        telegram_username=user.telegram_username,
        telegram_linked_at=user.telegram_linked_at,
    )
