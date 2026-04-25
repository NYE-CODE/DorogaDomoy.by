"""Pydantic schemas for API request/response."""
import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from belarus_phone import format_belarus_phone_storage


# --- User ---
class UserContacts(BaseModel):
    """Контакты как в БД / в ответах API — без валидации (старые данные могут быть любыми)."""
    phone: Optional[str] = None
    telegram: Optional[str] = None
    viber: Optional[str] = None


class UserContactsStrict(BaseModel):
    """Контакты при создании/обновлении: телефон и Viber — только РБ мобильные."""
    phone: Optional[str] = None
    telegram: Optional[str] = None
    viber: Optional[str] = None

    @field_validator("phone", "viber", mode="before")
    @classmethod
    def belarus_mobile_phone(cls, v):
        if v is None:
            return None
        s = str(v).strip()
        if not s:
            return None
        normalized = format_belarus_phone_storage(s)
        if normalized is None:
            raise ValueError(
                "Номер должен быть белорусским мобильным: +375 и код 25, 29, 33 или 44."
            )
        return normalized


class UserBase(BaseModel):
    email: str
    name: str
    contacts: UserContacts = UserContacts()


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    contacts: UserContactsStrict = UserContactsStrict()


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    role: str = "user"
    helper_code: Optional[str] = None
    helper_confirmed_count: int = 0
    points_balance: int = 0
    points_earned_total: int = 0
    is_blocked: Optional[bool] = False
    blocked_reason: Optional[str] = None
    telegram_id: Optional[int] = None
    telegram_username: Optional[str] = None
    telegram_linked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    contacts: Optional[UserContactsStrict] = None
    role: Optional[str] = None
    is_blocked: Optional[bool] = None
    blocked_reason: Optional[str] = None


class HelperLookupResponse(BaseModel):
    id: str
    name: str
    avatar: Optional[str] = None
    helper_code: str
    helper_confirmed_count: int = 0


class PointsTransactionResponse(BaseModel):
    id: str
    user_id: str
    pet_id: Optional[str] = None
    amount: int
    kind: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Pet ---
class PetLocation(BaseModel):
    lat: float
    lng: float


def _trim_optional_str(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


class PetBase(BaseModel):
    photos: list[str] = []
    animal_type: str  # cat, dog, other
    breed: Optional[str] = Field(None, max_length=80)
    colors: list[str] = []
    gender: str = "unknown"
    approximate_age: Optional[str] = None
    status: str = "searching"
    description: str
    city: str
    location: PetLocation
    contacts: UserContacts = Field(default_factory=UserContacts)
    reward_mode: str = "points"  # points | money
    reward_amount_byn: Optional[int] = Field(None, ge=1, le=1_000_000)
    reward_points: int = Field(50, ge=1)

    @field_validator("breed", mode="before")
    @classmethod
    def trim_breed(cls, v):
        return _trim_optional_str(v)


class PetCreate(PetBase):
    author_name: Optional[str] = None  # для отображения в объявлении при «другие контакты»
    contacts: UserContactsStrict = Field(default_factory=UserContactsStrict)


class PetUpdate(BaseModel):
    photos: Optional[list[str]] = None
    animal_type: Optional[str] = None
    breed: Optional[str] = Field(None, max_length=80)
    colors: Optional[list[str]] = None
    gender: Optional[str] = None
    approximate_age: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    location: Optional[PetLocation] = None
    contacts: Optional[UserContactsStrict] = None
    is_archived: Optional[bool] = None
    archive_reason: Optional[str] = None
    moderation_status: Optional[str] = None
    moderation_reason: Optional[str] = None
    reward_mode: Optional[str] = None
    reward_amount_byn: Optional[int] = Field(None, ge=1, le=1_000_000)
    reward_points: Optional[int] = Field(None, ge=1)
    reward_helper_code: Optional[str] = None

    @field_validator("breed", mode="before")
    @classmethod
    def trim_breed(cls, v):
        return _trim_optional_str(v)


class PetResponse(PetBase):
    id: str
    published_at: datetime
    updated_at: datetime
    author_id: str
    author_name: str
    is_archived: bool = False
    archive_reason: Optional[str] = None
    moderation_status: str = "pending"
    moderation_reason: Optional[str] = None
    moderated_at: Optional[datetime] = None
    moderated_by: Optional[str] = None
    reward_recipient_user_id: Optional[str] = None
    reward_points_awarded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FavoriteImportBody(BaseModel):
    """Импорт id из локального избранного после входа (до 150 за запрос)."""

    pet_ids: list[str] = Field(default_factory=list, max_length=150)


class FavoriteIdsResponse(BaseModel):
    ids: list[str]


# --- Report ---
class ReportCreate(BaseModel):
    pet_id: str
    reason: str  # spam, inappropriate, fake, duplicate, found, other
    description: str


class ReportUpdate(BaseModel):
    status: Optional[str] = None
    resolution: Optional[str] = None


class ReportResponse(BaseModel):
    id: str
    pet_id: str
    reporter_id: str
    reporter_name: str
    reason: str
    description: str
    created_at: datetime
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution: Optional[str] = None

    class Config:
        from_attributes = True


# --- Auth ---
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# --- Telegram Link ---
class TelegramLinkRequestResponse(BaseModel):
    code: str
    expires_in: int
    bot_url: str


class TelegramLinkStatusResponse(BaseModel):
    linked: bool
    telegram_username: Optional[str] = None


# --- Notification Settings ---
class NotificationSettingsResponse(BaseModel):
    notifications_enabled: bool = True
    notification_radius_km: float = 1.0

    class Config:
        from_attributes = True


class NotificationSettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    notification_radius_km: Optional[float] = Field(None, ge=1.0, le=10.0)


# --- Notifications ---
class NotificationResponse(BaseModel):
    id: str
    pet_id: str
    type: str
    message: str
    is_read: bool
    sent_via: str
    sent_at: datetime

    class Config:
        from_attributes = True


# --- Statistics ---
# Причины архивации со счастливым концом (найден питомец)
ARCHIVE_HAPPY_KEYWORDS = ("вернулся домой", "найден хозяин", "пристроен", "приют")


def _is_happy_archive(reason: Optional[str]) -> bool:
    if not reason:
        return False
    r = reason.lower()
    return any(kw in r for kw in ARCHIVE_HAPPY_KEYWORDS)


class StatisticsResponse(BaseModel):
    searching: int
    found: int
    fostering: int = 0
    # Для лендинга
    cities_count: int = 0  # количество городов с активными объявлениями
    found_pets: int = 0  # архив: питомец вернулся/пристроен/приют
    success_rate: Optional[float] = None  # процент найденных (None если выборка < 5)
    users_count: int = 0  # всего зарегистрированных пользователей


# --- Sightings ---
class SightingCreate(BaseModel):
    pet_id: str
    location_lat: float
    location_lng: float
    seen_at: datetime
    comment: Optional[str] = Field(None, max_length=500)
    contact: Optional[str] = Field(None, max_length=100)


class SightingResponse(BaseModel):
    id: str
    pet_id: str
    location_lat: float
    location_lng: float
    seen_at: datetime
    comment: Optional[str] = None
    has_contact: bool = False  # True if contact was provided (value hidden for privacy)
    created_at: datetime

    class Config:
        from_attributes = True
        # SightingResponse is built manually in sighting_to_response, not from ORM


# --- Media Articles (СМИ о нас) ---
class MediaArticleCreate(BaseModel):
    logo_url: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=100)
    published_at: datetime
    link: Optional[str] = None


class MediaArticleUpdate(BaseModel):
    logo_url: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    published_at: Optional[datetime] = None
    link: Optional[str] = None


class MediaArticleResponse(BaseModel):
    id: str
    logo_url: Optional[str] = None
    title: str
    published_at: datetime
    link: Optional[str] = None

    class Config:
        from_attributes = True


# --- Partners (Наши партнеры) ---
class PartnerCreate(BaseModel):
    logo_url: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    link: Optional[str] = None
    is_medallion_partner: bool = False


class PartnerUpdate(BaseModel):
    logo_url: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    link: Optional[str] = None
    is_medallion_partner: Optional[bool] = None


class PartnerResponse(BaseModel):
    id: str
    logo_url: Optional[str] = None
    name: str
    link: Optional[str] = None
    is_medallion_partner: bool = False

    class Config:
        from_attributes = True


# --- FAQ (лендинг) ---
class FaqItemCreate(BaseModel):
    question_ru: str = Field(default="", max_length=4000)
    question_be: str = Field(default="", max_length=4000)
    question_en: str = Field(default="", max_length=4000)
    answer_ru: str = Field(default="", max_length=16000)
    answer_be: str = Field(default="", max_length=16000)
    answer_en: str = Field(default="", max_length=16000)
    sort_order: int = 0


class FaqItemUpdate(BaseModel):
    question_ru: Optional[str] = Field(None, max_length=4000)
    question_be: Optional[str] = Field(None, max_length=4000)
    question_en: Optional[str] = Field(None, max_length=4000)
    answer_ru: Optional[str] = Field(None, max_length=16000)
    answer_be: Optional[str] = Field(None, max_length=16000)
    answer_en: Optional[str] = Field(None, max_length=16000)
    sort_order: Optional[int] = None


class FaqItemResponse(BaseModel):
    id: str
    question_ru: str
    question_be: str
    question_en: str
    answer_ru: str
    answer_be: str
    answer_en: str
    sort_order: int

    class Config:
        from_attributes = True


# --- Profile Pets (адресник / QR) ---
class ProfilePetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    species: str  # dog, cat, other
    breed: Optional[str] = Field(None, max_length=80)
    gender: str = "male"
    age: Optional[str] = Field(None, max_length=20)
    colors: list[str] = []
    special_marks: Optional[str] = None
    is_chipped: bool = False
    chip_number: Optional[str] = Field(None, max_length=40)
    medical_info: Optional[str] = None
    temperament: Optional[str] = Field(None, max_length=40)
    responds_to_name: bool = True
    favorite_treats: Optional[str] = None
    favorite_walks: Optional[str] = None
    photos: list[str] = []

    @field_validator("breed", mode="before")
    @classmethod
    def trim_breed(cls, v):
        return _trim_optional_str(v)


class ProfilePetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    species: Optional[str] = None
    breed: Optional[str] = Field(None, max_length=80)
    gender: Optional[str] = None
    age: Optional[str] = Field(None, max_length=20)
    colors: Optional[list[str]] = None
    special_marks: Optional[str] = None
    is_chipped: Optional[bool] = None
    chip_number: Optional[str] = Field(None, max_length=40)
    medical_info: Optional[str] = None
    temperament: Optional[str] = Field(None, max_length=40)
    responds_to_name: Optional[bool] = None
    favorite_treats: Optional[str] = None
    favorite_walks: Optional[str] = None
    photos: Optional[list[str]] = None

    @field_validator("breed", mode="before")
    @classmethod
    def trim_breed(cls, v):
        return _trim_optional_str(v)


class ProfilePetResponse(BaseModel):
    id: str
    owner_id: str
    name: str
    species: str
    breed: Optional[str] = None
    gender: str = "male"
    age: Optional[str] = None
    colors: list[str] = []
    special_marks: Optional[str] = None
    is_chipped: bool = False
    chip_number: Optional[str] = None
    medical_info: Optional[str] = None
    temperament: Optional[str] = None
    responds_to_name: bool = True
    favorite_treats: Optional[str] = None
    favorite_walks: Optional[str] = None
    photos: list[str] = []
    created_at: datetime
    updated_at: datetime
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None
    owner_email: Optional[str] = None
    owner_city: Optional[str] = None
    owner_viber: Optional[str] = None
    # True, если у владельца привязан Telegram — доступна отправка сигнала «нашёл питомца»
    owner_telegram_linked: bool = False

    class Config:
        from_attributes = True


class ProfilePetFoundSignalResponse(BaseModel):
    accepted: bool = True
    throttled: bool = False
    telegram_sent: bool = False
    detail: str = "ok"


# --- Blog ---
_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_slug(v: str) -> str:
    s = (v or "").strip().lower()
    if not s or len(s) > 120 or not _SLUG_RE.match(s):
        raise ValueError("slug: только латиница, цифры и дефисы, например moya-statya")
    return s


class BlogCategoryResponse(BaseModel):
    id: str
    slug: str
    title: str
    sort_order: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BlogCategoryCreate(BaseModel):
    slug: str
    title: str = Field(..., min_length=1, max_length=200)
    sort_order: int = Field(default=0, ge=-10_000, le=10_000)

    @field_validator("slug", mode="before")
    @classmethod
    def slug_fmt(cls, v):
        return validate_slug(str(v))


class BlogCategoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    sort_order: Optional[int] = Field(None, ge=-10_000, le=10_000)


class BlogPostCreate(BaseModel):
    slug: str
    title: str = Field(..., min_length=1, max_length=200)
    excerpt: Optional[str] = Field(None, max_length=2000)
    body_md: str = Field(..., min_length=1, max_length=200_000)
    cover_image_url: Optional[str] = Field(None, max_length=2000)
    meta_description: Optional[str] = Field(None, max_length=320)
    category: str = Field(default="guides", max_length=40)
    status: str = Field(default="draft")  # draft, published

    @field_validator("slug", mode="before")
    @classmethod
    def slug_fmt(cls, v):
        return validate_slug(str(v))

    @field_validator("status")
    @classmethod
    def status_ok(cls, v):
        if v not in ("draft", "published"):
            raise ValueError("status: draft или published")
        return v


class BlogPostUpdate(BaseModel):
    slug: Optional[str] = None
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    excerpt: Optional[str] = Field(None, max_length=2000)
    body_md: Optional[str] = Field(None, min_length=1, max_length=200_000)
    cover_image_url: Optional[str] = Field(None, max_length=2000)
    meta_description: Optional[str] = Field(None, max_length=320)
    category: Optional[str] = Field(None, max_length=40)
    status: Optional[str] = None

    @field_validator("slug", mode="before")
    @classmethod
    def slug_fmt(cls, v):
        if v is None or (isinstance(v, str) and not str(v).strip()):
            return None
        return validate_slug(str(v))

    @field_validator("status")
    @classmethod
    def status_ok(cls, v):
        if v is None:
            return None
        if v not in ("draft", "published"):
            raise ValueError("status: draft или published")
        return v


class BlogPostListItem(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: str
    category_title: str
    published_at: datetime
    reading_minutes: int = 1


class BlogPostPublicResponse(BaseModel):
    id: str
    slug: str
    title: str
    excerpt: Optional[str] = None
    body_md: str
    cover_image_url: Optional[str] = None
    meta_description: Optional[str] = None
    category: str
    category_title: str
    published_at: datetime
    reading_minutes: int = 1
    telegram_post_url: Optional[str] = None

    class Config:
        from_attributes = True


class BlogPostAdminResponse(BlogPostPublicResponse):
    status: str
    created_at: datetime
    updated_at: datetime
    author_id: Optional[str] = None
    telegram_message_id: Optional[int] = None
    telegram_channel_username: Optional[str] = None


# --- Instagram Publications ---
class InstagramAccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    instagram_business_id: str = Field(..., min_length=1, max_length=120)
    facebook_page_id: Optional[str] = Field(None, max_length=120)
    access_token: Optional[str] = Field(None, max_length=4000)
    is_active: bool = True


class InstagramAccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    instagram_business_id: Optional[str] = Field(None, min_length=1, max_length=120)
    facebook_page_id: Optional[str] = Field(None, max_length=120)
    access_token: Optional[str] = Field(None, max_length=4000)
    is_active: Optional[bool] = None


class InstagramAccountResponse(BaseModel):
    id: str
    name: str
    instagram_business_id: str
    facebook_page_id: Optional[str] = None
    has_access_token: bool = False
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InstagramRegionRouteCreate(BaseModel):
    region_key: str = Field(..., min_length=1, max_length=120)
    account_id: str = Field(..., min_length=1, max_length=120)
    is_fallback: bool = False


class InstagramRegionRouteUpdate(BaseModel):
    account_id: Optional[str] = Field(None, min_length=1, max_length=120)
    is_fallback: Optional[bool] = None


class InstagramRegionRouteResponse(BaseModel):
    id: str
    region_key: str
    account_id: str
    account_name: str
    is_fallback: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InstagramPublicationCreateManual(BaseModel):
    pet_id: str = Field(..., min_length=1, max_length=120)
    format: str = Field(default="story")

    @field_validator("format")
    @classmethod
    def format_ok(cls, v):
        if v != "story":
            raise ValueError("format: only story")
        return v


class InstagramPublicationResponse(BaseModel):
    id: str
    pet_id: str
    account_id: Optional[str] = None
    account_name: Optional[str] = None
    initiated_by: Optional[str] = None
    region_key: Optional[str] = None
    mode: str
    source: str = "auto"
    requested_by_user_id: Optional[str] = None
    requested_at: Optional[datetime] = None
    format: str
    status: str
    attempts: int
    last_error: Optional[str] = None
    external_media_id: Optional[str] = None
    idempotency_key: str
    payload: dict = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InstagramBoostCreate(BaseModel):
    pet_id: str = Field(..., min_length=1, max_length=120)


class InstagramBoostEligibilityResponse(BaseModel):
    eligible: bool
    reason: str
    next_available_at: Optional[datetime] = None
    pet_age_days: Optional[int] = None
