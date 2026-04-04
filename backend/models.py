"""SQLAlchemy models for User, Pet, Report, Notifications."""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, BigInteger
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    role = Column(String, default="user")  # user, volunteer, shelter, admin
    contacts = Column(JSON, default=dict)  # {phone?, telegram?, viber?}
    is_blocked = Column(Boolean, default=False)
    blocked_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    telegram_username = Column(String, nullable=True)
    telegram_linked_at = Column(DateTime, nullable=True)

    pets = relationship("Pet", back_populates="author", foreign_keys="Pet.author_id")
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    notification_settings = relationship("NotificationSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(String, primary_key=True, index=True)
    photos = Column(JSON, default=list)  # list of URL strings
    animal_type = Column(String, nullable=False)  # cat, dog, other
    breed = Column(String, nullable=True)
    colors = Column(JSON, default=list)  # list of color strings
    gender = Column(String, default="unknown")  # male, female, unknown
    approximate_age = Column(String, nullable=True)
    status = Column(String, default="searching")  # searching, found
    description = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author_id = Column(String, ForeignKey("users.id"), nullable=False)
    author_name = Column(String, nullable=False)
    contacts = Column(JSON, default=dict)  # {telegram?, phone?, viber?}
    is_archived = Column(Boolean, default=False)
    archive_reason = Column(String, nullable=True)
    moderation_status = Column(String, default="pending")  # pending, approved, rejected
    moderation_reason = Column(String, nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    moderated_by = Column(String, nullable=True)

    author = relationship("User", back_populates="pets", foreign_keys=[author_id])
    reports = relationship(
        "Report",
        back_populates="pet",
        foreign_keys="Report.pet_id",
        cascade="all, delete-orphan",
    )
    sightings = relationship("Sighting", back_populates="pet", foreign_keys="Sighting.pet_id", cascade="all, delete-orphan")


class PlatformSettings(Base):
    __tablename__ = "platform_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    reporter_name = Column(String, nullable=False)
    reason = Column(String, nullable=False)  # spam, inappropriate, fake, duplicate, found, other
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, reviewed, resolved, dismissed
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    resolution = Column(Text, nullable=True)

    pet = relationship("Pet", back_populates="reports", foreign_keys=[pet_id])
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])


class TelegramLinkCode(Base):
    __tablename__ = "telegram_link_codes"

    id = Column(String, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)

    user = relationship("User")


class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    notifications_enabled = Column(Boolean, default=True)
    notification_radius_km = Column(Float, default=1.0)
    notify_animal_types = Column(JSON, default=lambda: ["dog", "cat", "other"])
    home_lat = Column(Float, nullable=True)
    home_lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="notification_settings")


class Sighting(Base):
    """Видения: отметки «видел похожее животное» на карте объявления."""
    __tablename__ = "sightings"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    seen_at = Column(DateTime, nullable=False)  # когда видели
    comment = Column(Text, nullable=True)
    contact = Column(String, nullable=True)  # телефон или @telegram
    reporter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    ip_hash = Column(String, nullable=True, index=True)  # для rate limit анонимов
    created_at = Column(DateTime, default=datetime.utcnow)

    pet = relationship("Pet", back_populates="sightings", foreign_keys=[pet_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # new_nearby, status_update
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    sent_via = Column(String, default="telegram")  # telegram, web
    sent_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    pet = relationship("Pet")


class MediaArticle(Base):
    """Публикации СМИ о платформе для секции «СМИ о нас» на лендинге."""
    __tablename__ = "media_articles"

    id = Column(String, primary_key=True, index=True)
    logo_url = Column(String, nullable=True)  # URL логотипа СМИ или base64
    title = Column(String, nullable=False)  # заголовок публикации
    published_at = Column(DateTime, nullable=False)  # дата публикации
    link = Column(String, nullable=True)  # ссылка на статью
    sort_order = Column(String, default="0")  # порядок сортировки (для будущего)


class Partner(Base):
    """Партнёры платформы для секции «Наши партнеры» на лендинге."""
    __tablename__ = "partners"

    id = Column(String, primary_key=True, index=True)
    logo_url = Column(String, nullable=True)  # URL логотипа
    name = Column(String, nullable=False)  # название компании
    link = Column(String, nullable=True)  # ссылка на сайт партнёра


class ProfilePet(Base):
    """Профиль питомца пользователя (адресник / QR)."""
    __tablename__ = "profile_pets"

    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    species = Column(String, nullable=False)  # dog, cat, other
    breed = Column(String, nullable=True)
    gender = Column(String, default="male")  # male, female
    age = Column(String, nullable=True)
    colors = Column(JSON, default=list)
    special_marks = Column(Text, nullable=True)
    is_chipped = Column(Boolean, default=False)
    chip_number = Column(String, nullable=True)
    medical_info = Column(Text, nullable=True)
    temperament = Column(String, nullable=True)
    responds_to_name = Column(Boolean, default=True)
    favorite_treats = Column(Text, nullable=True)
    favorite_walks = Column(Text, nullable=True)
    photos = Column(JSON, default=list)  # list of URL strings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", backref="profile_pets", foreign_keys=[owner_id])
