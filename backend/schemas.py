"""Pydantic schemas for API request/response."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# --- User ---
class UserContacts(BaseModel):
    phone: Optional[str] = None
    telegram: Optional[str] = None
    viber: Optional[str] = None


class UserBase(BaseModel):
    email: str
    name: str
    contacts: UserContacts = UserContacts()


class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    contacts: UserContacts = UserContacts()


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    role: str = "user"
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
    contacts: Optional[UserContacts] = None
    role: Optional[str] = None
    is_blocked: Optional[bool] = None
    blocked_reason: Optional[str] = None


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
    contacts: UserContacts = UserContacts()

    @field_validator("breed", mode="before")
    @classmethod
    def trim_breed(cls, v):
        return _trim_optional_str(v)


class PetCreate(PetBase):
    author_name: Optional[str] = None  # для отображения в объявлении при «другие контакты»


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
    contacts: Optional[UserContacts] = None
    is_archived: Optional[bool] = None
    archive_reason: Optional[str] = None
    moderation_status: Optional[str] = None
    moderation_reason: Optional[str] = None

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

    class Config:
        from_attributes = True


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


class PartnerUpdate(BaseModel):
    logo_url: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    link: Optional[str] = None


class PartnerResponse(BaseModel):
    id: str
    logo_url: Optional[str] = None
    name: str
    link: Optional[str] = None

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

    class Config:
        from_attributes = True
