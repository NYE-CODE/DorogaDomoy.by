"""SQLAlchemy models for User, Pet, Report."""
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Float
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

    pets = relationship("Pet", back_populates="author", foreign_keys="Pet.author_id")
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")


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
    reports = relationship("Report", back_populates="pet", foreign_keys="Report.pet_id")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
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
