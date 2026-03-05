"""Pydantic schemas for API request/response."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# --- User ---
class UserContacts(BaseModel):
    phone: Optional[str] = None
    telegram: Optional[str] = None
    viber: Optional[str] = None


class UserBase(BaseModel):
    email: str
    name: str
    role: str = "user"
    contacts: UserContacts = UserContacts()


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(UserBase):
    id: str
    avatar: Optional[str] = None
    is_blocked: Optional[bool] = False
    blocked_reason: Optional[str] = None

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


class PetBase(BaseModel):
    photos: list[str] = []
    animal_type: str  # cat, dog, other
    breed: Optional[str] = None
    colors: list[str] = []
    gender: str = "unknown"
    approximate_age: Optional[str] = None
    status: str = "searching"
    description: str
    city: str
    location: PetLocation
    contacts: UserContacts = UserContacts()


class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    photos: Optional[list[str]] = None
    animal_type: Optional[str] = None
    breed: Optional[str] = None
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


# --- Statistics ---
class StatisticsResponse(BaseModel):
    searching: int
    found: int
    fostering: int = 0
