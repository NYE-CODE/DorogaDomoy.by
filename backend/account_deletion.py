"""Удаление аккаунта пользователя и связанных записей."""
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from models import (
    BlogPost,
    Notification,
    NotificationSettings,
    PasswordResetToken,
    Pet,
    PetFavorite,
    PointsTransaction,
    ProfilePet,
    Report,
    Shelter,
    ShelterCampaign,
    TelegramLinkCode,
    User,
)

try:
    from models import DeviceToken
except ImportError:
    DeviceToken = None


def _delete_owned_shelters(db: Session, uid: str) -> None:
    """Карточки приютов владельца и их объявления (как admin_delete_shelter).

    Иначе при ``ON DELETE SET NULL`` у ``pets.shelter_id`` остаются объявления без приюта.
    Подписки, членство и сборы по приюту снимаются каскадом БД при удалении ``shelters``.
    """
    shelter_ids = list(db.scalars(select(Shelter.id).where(Shelter.owner_user_id == uid)))
    if not shelter_ids:
        return
    shelter_pets = list(db.scalars(select(Pet).where(Pet.shelter_id.in_(shelter_ids))))
    pet_ids = [p.id for p in shelter_pets]
    if pet_ids:
        db.execute(delete(Report).where(Report.pet_id.in_(pet_ids)))
        db.execute(delete(Pet).where(Pet.id.in_(pet_ids)))
    db.execute(delete(Shelter).where(Shelter.id.in_(shelter_ids)))


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
    if DeviceToken is not None:
        db.execute(delete(DeviceToken).where(DeviceToken.user_id == uid))
    db.execute(delete(PetFavorite).where(PetFavorite.user_id == uid))
    db.execute(delete(PointsTransaction).where(PointsTransaction.user_id == uid))
    db.execute(delete(Pet).where(Pet.author_id == uid))
    db.execute(delete(ProfilePet).where(ProfilePet.owner_id == uid))
    _delete_owned_shelters(db, uid)
    db.delete(user)
