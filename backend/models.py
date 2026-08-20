"""SQLAlchemy models for User, Pet, Report, Notifications."""
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, BigInteger, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=True)
    # False — вход только через Telegram, пока пользователь не задаст пароль
    password_set = Column(Boolean, default=True, nullable=False)
    # False — нужен шаг «завершить профиль» (email, роль) после первого входа через TG
    profile_completed = Column(Boolean, default=True, nullable=False)
    avatar = Column(String, nullable=True)
    role = Column(String, default="user")  # user, volunteer, admin
    registered_as_volunteer = Column(Boolean, default=False, nullable=False)
    contacts = Column(JSON, default=dict)  # {phone?, telegram?, viber?}
    is_blocked = Column(Boolean, default=False)
    blocked_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    telegram_username = Column(String, nullable=True)
    telegram_linked_at = Column(DateTime, nullable=True)
    helper_code = Column(String, unique=True, nullable=True, index=True)
    helper_confirmed_count = Column(Integer, default=0, nullable=False)
    points_balance = Column(Integer, default=0, nullable=False)
    points_earned_total = Column(Integer, default=0, nullable=False)

    pets = relationship("Pet", back_populates="author", foreign_keys="Pet.author_id")
    owned_shelters = relationship(
        "Shelter",
        back_populates="owner",
        foreign_keys="Shelter.owner_user_id",
        cascade="all, delete-orphan",
    )
    shelter_memberships = relationship(
        "ShelterMembership",
        back_populates="user",
        foreign_keys="ShelterMembership.user_id",
        cascade="all, delete-orphan",
    )
    pet_favorites = relationship("PetFavorite", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")
    notification_settings = relationship("NotificationSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
    device_tokens = relationship("DeviceToken", back_populates="user", cascade="all, delete-orphan")


class Pet(Base):
    __tablename__ = "pets"

    id = Column(String, primary_key=True, index=True)
    photos = Column(JSON, default=list)  # list of URL strings
    animal_type = Column(String, nullable=False)  # cat, dog, other
    breed = Column(String, nullable=True)
    colors = Column(JSON, default=list)  # list of color strings
    gender = Column(String, default="unknown")  # male, female, unknown
    approximate_age = Column(String, nullable=True)  # категория: менее/более 2 года
    approximate_age_raw = Column(String, nullable=True)  # исходная строка возраста (для отображения)
    status = Column(String, default="searching")  # searching, found
    description = Column(Text, nullable=False)
    distinctive_marks = Column(JSON, default=list)  # list[str] — видимые приметы (ИИ / автор)
    city = Column(String, nullable=False)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # срок размещения (lost_found)
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
    reward_mode = Column(String, default="points", nullable=False)  # points, money
    reward_amount_byn = Column(Integer, nullable=True)  # owner-paid reward, off-platform
    reward_points = Column(Integer, default=50, nullable=False)  # platform points for confirmed helper
    reward_recipient_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    reward_points_awarded_at = Column(DateTime, nullable=True)
    pet_scope = Column(String, default="lost_found", nullable=False)  # lost_found, shelter_pet
    shelter_id = Column(String, ForeignKey("shelters.id", ondelete="SET NULL"), nullable=True, index=True)
    adoption_status = Column(String, nullable=True)  # available, reserved, adopted, on_treatment, not_for_adoption
    is_published = Column(Boolean, default=True, nullable=False)
    published_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    updated_by_user_id = Column(String, ForeignKey("users.id"), nullable=True)
    # Учёт в РБ: орган (как на жетоне) и номер жетона — необязательно
    registration_authority = Column(String, nullable=True)
    registration_token_number = Column(String, nullable=True)
    photo_embedding = Column(JSON, nullable=True)  # CLIP: list of vectors (legacy: single vector)
    # Опциональная связь с карточкой питомца (адресник); при удалении профиля — SET NULL
    profile_pet_id = Column(
        String,
        ForeignKey("profile_pets.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    author = relationship("User", back_populates="pets", foreign_keys=[author_id])
    profile_pet = relationship("ProfilePet", foreign_keys=[profile_pet_id])
    reports = relationship(
        "Report",
        back_populates="pet",
        foreign_keys="Report.pet_id",
        cascade="all, delete-orphan",
    )
    sightings = relationship("Sighting", back_populates="pet", foreign_keys="Sighting.pet_id", cascade="all, delete-orphan")
    shelter_details = relationship(
        "ShelterPetDetails",
        back_populates="pet",
        uselist=False,
        cascade="all, delete-orphan",
    )


class ShelterPetDetails(Base):
    __tablename__ = "shelter_pet_details"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    nickname = Column(String, nullable=True)
    health_status = Column(String, nullable=True)  # disabled, treatment, good, excellent
    coat_type = Column(String, nullable=True)  # smooth, semi, fluffy
    adoption_status = Column(String, nullable=True)  # available, reserved, adopted, on_treatment, not_for_adoption
    is_published = Column(Boolean, default=True, nullable=False)
    # Черты характера для подбора (шкалы 1-5, nullable = «не указано»)
    energy_level = Column(Integer, nullable=True)  # активность: 1 диван — 5 марафонец
    friendliness_level = Column(Integer, nullable=True)  # контактность/доверие к людям
    training_level = Column(Integer, nullable=True)  # воспитанность (лоток/команды/поводок)
    independence_level = Column(Integer, nullable=True)  # переносит одиночество
    # Совместимость: yes / no / unknown
    good_with_kids = Column(String, nullable=True)
    good_with_dogs = Column(String, nullable=True)
    good_with_cats = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pet = relationship("Pet", back_populates="shelter_details", foreign_keys=[pet_id])


class ShelterCampaign(Base):
    __tablename__ = "shelter_campaigns"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    shelter_id = Column(String, ForeignKey("shelters.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    help_details = Column(Text, nullable=True)  # как помочь: реквизиты/инструкция
    goal_amount = Column(Integer, nullable=False, default=0)
    collected_amount = Column(Integer, nullable=False, default=0)
    status = Column(String, nullable=False, default="draft")  # draft, active, completed, cancelled
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    close_reason = Column(Text, nullable=True)
    created_by_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    pet = relationship("Pet", foreign_keys=[pet_id])
    shelter = relationship("Shelter", foreign_keys=[shelter_id])
    created_by = relationship("User", foreign_keys=[created_by_user_id])


class PetFavorite(Base):
    """Объявления в избранном пользователя (серверная синхронизация после входа)."""

    __tablename__ = "pet_favorites"
    __table_args__ = (UniqueConstraint("user_id", "pet_id", name="uq_pet_favorites_user_pet"),)

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="pet_favorites")
    pet = relationship("Pet")


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


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)

    user = relationship("User")


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
    notify_similar_matches = Column(Boolean, default=True)
    watch_zone_enabled = Column(Boolean, default=False)
    watch_radius_km = Column(Float, default=5.0)
    notify_animal_types = Column(JSON, default=lambda: ["dog", "cat", "other"])
    home_lat = Column(Float, nullable=True)
    home_lng = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="notification_settings")


class DeviceToken(Base):
    """FCM device tokens for mobile push."""
    __tablename__ = "device_tokens"
    __table_args__ = (UniqueConstraint("token", name="uq_device_tokens_token"),)

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String, nullable=False)
    platform = Column(String, nullable=False, default="android")
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="device_tokens")


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


class PointsTransaction(Base):
    __tablename__ = "points_transactions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    pet_id = Column(String, ForeignKey("pets.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Integer, nullable=False)
    kind = Column(String, nullable=False)  # helper_reward, manual_adjustment, etc.
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


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
    is_medallion_partner = Column(Boolean, default=False, nullable=False)


class PartnerAd(Base):
    """Рекламные баннеры партнёров с привязкой к слотам размещения."""
    __tablename__ = "partner_ads"

    id = Column(String, primary_key=True, index=True)
    partner_id = Column(String, ForeignKey("partners.id"), nullable=True, index=True)
    title = Column(String, nullable=False)  # внутреннее имя для админки
    sponsor_label = Column(String, nullable=True)  # подпись «Реклама · …»
    image_desktop = Column(String, nullable=False)
    image_mobile = Column(String, nullable=True)
    link_url = Column(String, nullable=False)
    alt_text = Column(String, nullable=True)
    placements = Column(JSON, default=list, nullable=False)  # list[str]
    priority = Column(Integer, default=0, nullable=False)
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class HelpDonationTier(Base):
    """Варианты суммы поддержки проекта для секции «Как нам помочь» на лендинге."""

    __tablename__ = "help_donation_tiers"

    id = Column(String, primary_key=True, index=True)
    label = Column(String, nullable=False)
    payment_url = Column(String, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)


class FaqItem(Base):
    """Вопросы и ответы для секции FAQ на лендинге (три языка)."""

    __tablename__ = "faq_items"

    id = Column(String, primary_key=True, index=True)
    question_ru = Column(Text, nullable=False, default="")
    question_be = Column(Text, nullable=False, default="")
    question_en = Column(Text, nullable=False, default="")
    answer_ru = Column(Text, nullable=False, default="")
    answer_be = Column(Text, nullable=False, default="")
    answer_en = Column(Text, nullable=False, default="")
    sort_order = Column(Integer, default=0, nullable=False)


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
    registration_authority = Column(String, nullable=True)
    registration_token_number = Column(String, nullable=True)
    medical_info = Column(Text, nullable=True)
    temperament = Column(String, nullable=True)
    responds_to_name = Column(Boolean, default=True)
    favorite_treats = Column(Text, nullable=True)
    favorite_walks = Column(Text, nullable=True)
    photos = Column(JSON, default=list)  # list of URL strings
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", backref="profile_pets", foreign_keys=[owner_id])


class BlogCategory(Base):
    """Категория статей блога (динамический справочник; slug хранится в blog_posts.category)."""

    __tablename__ = "blog_categories"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class BlogPost(Base):
    """Статья блога: публикация на сайте и анонс в Telegram."""

    __tablename__ = "blog_posts"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    excerpt = Column(Text, nullable=True)
    body_md = Column(Text, nullable=False)
    cover_image_url = Column(String, nullable=True)
    meta_description = Column(String, nullable=True)
    category = Column(String, default="guides")
    status = Column(String, default="draft")  # draft, published
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    telegram_message_id = Column(Integer, nullable=True)
    telegram_channel_username = Column(String, nullable=True)

    author = relationship("User", foreign_keys=[author_id])


class GuideCategory(Base):
    """Категория видеогайдов (slug хранится в guide_videos.category)."""

    __tablename__ = "guide_categories"

    id = Column(String, primary_key=True, index=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    title = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GuideVideo(Base):
    """Видеогайд с YouTube для публичной страницы /guides."""

    __tablename__ = "guide_videos"

    id = Column(String, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    youtube_url = Column(String, nullable=False)
    video_id = Column(String, nullable=False, index=True)
    sort_order = Column(Integer, default=0, nullable=False)
    status = Column(String, default="draft", nullable=False)  # draft, published
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Shelter(Base):
    """Карточка организации в каталоге — владелец: пользователь-волонтёр."""

    __tablename__ = "shelters"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    kind = Column(String, nullable=False, default="shelter")  # shelter, foster, vet, other
    animal_focus = Column(String, nullable=False, default="mixed")  # dogs, cats, mixed
    description = Column(Text, nullable=True)
    city = Column(String, nullable=False)
    address = Column(String, nullable=True)
    location_lat = Column(Float, nullable=False)
    location_lng = Column(Float, nullable=False)
    contacts = Column(JSON, default=dict)
    logo_url = Column(Text, nullable=True)
    cover_url = Column(Text, nullable=True)  # широкое изображение-шапка публичной страницы (путь /uploads/…)
    moderation_status = Column(String, nullable=False, default="draft")  # draft, pending, approved, rejected, hidden
    moderation_reason = Column(String, nullable=True)
    moderated_at = Column(DateTime, nullable=True)
    moderated_by = Column(String, nullable=True)
    owner_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="owned_shelters", foreign_keys=[owner_user_id])
    memberships = relationship(
        "ShelterMembership",
        back_populates="shelter",
        foreign_keys="ShelterMembership.shelter_id",
        cascade="all, delete-orphan",
    )


class ShelterMembership(Base):
    """Членство пользователя в приюте (owner/manager/volunteer)."""

    __tablename__ = "shelter_memberships"
    __table_args__ = (UniqueConstraint("shelter_id", "user_id", name="uq_shelter_memberships_shelter_user"),)

    id = Column(String, primary_key=True, index=True)
    shelter_id = Column(String, ForeignKey("shelters.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False, default="volunteer")  # owner, manager, volunteer
    status = Column(String, nullable=False, default="active")  # invited, active, removed
    invited_by_user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    joined_at = Column(DateTime, nullable=True)
    removed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    shelter = relationship("Shelter", back_populates="memberships", foreign_keys=[shelter_id])
    user = relationship("User", back_populates="shelter_memberships", foreign_keys=[user_id])


class ShelterSubscription(Base):
    """Подписка пользователя на уведомления о приюте (Telegram — см. отправку в shelter_subscription_notify)."""

    __tablename__ = "shelter_subscriptions"
    __table_args__ = (UniqueConstraint("user_id", "shelter_id", name="uq_shelter_subscription_user_shelter"),)

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    shelter_id = Column(String, ForeignKey("shelters.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ProfilePetScanSignal(Base):
    """Сигналы со страницы адресника (QR/NFC): «я нашёл питомца»."""
    __tablename__ = "profile_pet_scan_signals"

    id = Column(String, primary_key=True, index=True)
    profile_pet_id = Column(String, ForeignKey("profile_pets.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    ip_hash = Column(String, nullable=True, index=True)
    source = Column(String, default="unknown")  # qr, nfc, unknown
    telegram_sent = Column(Boolean, default=False)
    push_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    profile_pet = relationship("ProfilePet", foreign_keys=[profile_pet_id])
