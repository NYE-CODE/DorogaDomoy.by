"""Маппинг User ORM → API-схемы (роутеры не тянут логику через utils)."""
from models import User
from schemas import UserResponse


def user_to_response(
    user: User,
    *,
    include_block_status: bool = True,
    include_telegram: bool = True,
) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar=user.avatar,
        role=user.role,
        contacts=user.contacts or {},
        is_blocked=user.is_blocked if include_block_status else False,
        blocked_reason=user.blocked_reason if include_block_status else None,
        telegram_id=user.telegram_id if include_telegram else None,
        telegram_username=user.telegram_username if include_telegram else None,
        telegram_linked_at=user.telegram_linked_at if include_telegram else None,
    )
