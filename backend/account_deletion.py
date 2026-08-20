"""Удаление аккаунта пользователя и связанных записей."""
from sqlalchemy import delete, update
from sqlalchemy.orm import Session

from models import (
    BlogPost,
    DeviceToken,
    Notification,
    NotificationSettings,
    PasswordResetToken,
    Pet,
    PetFavorite,
    PointsTransaction,
    ProfilePet,
    Report,
    ShelterCampaign,
    TelegramLinkCode,
    User,
)


def delete_user_account(db: Session, user: User) -> None:
    """Стирает данные пользователя. Commit — на стороне вызывающего."""
    uid = user.id

    db.execute(
        update(Pet)
        .where(Pet.reward_recipient_user_id == uid)
        .values(reward_recipient_user_id=None)
    )
    db.execute(
        update(Pet)
        .where(Pet.published_by_user_id == uid)
        .values(published_by_user_id=None)
    )
    db.execute(
        update(Pet)
        .where(Pet.updated_by_user_id == uid)
        .values(updated_by_user_id=None)
    )
    db.execute(update(BlogPost).where(BlogPost.author_id == uid).values(author_id=None))

    db.execute(delete(ShelterCampaign).where(ShelterCampaign.created_by_user_id == uid))
    db.execute(delete(Report).where(Report.reporter_id == uid))
    db.execute(delete(Notification).where(Notification.user_id == uid))
    db.execute(delete(NotificationSettings).where(NotificationSettings.user_id == uid))
    db.execute(delete(TelegramLinkCode).where(TelegramLinkCode.user_id == uid))
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == uid))
    db.execute(delete(DeviceToken).where(DeviceToken.user_id == uid))
    db.execute(delete(PetFavorite).where(PetFavorite.user_id == uid))
    db.execute(delete(PointsTransaction).where(PointsTransaction.user_id == uid))
    db.execute(delete(Pet).where(Pet.author_id == uid))
    db.execute(delete(ProfilePet).where(ProfilePet.owner_id == uid))
    db.delete(user)
