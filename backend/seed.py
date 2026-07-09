"""Seed database with initial admin user and sample data."""
import os
import secrets

from sqlalchemy import func, select

from database import init_db, SessionLocal
from models import User, Pet  # загружает ORM до init_db()
from auth import get_password_hash

init_db()
db = SessionLocal()


def _resolve_seed_admin_password() -> str:
    """Пароль только из env или одноразовая генерация — без захардкоженных значений в репозитории."""
    explicit = (os.getenv("SEED_ADMIN_PASSWORD") or "").strip()
    if explicit:
        return explicit
    generated = secrets.token_urlsafe(18)
    print(
        "SEED_ADMIN_PASSWORD не задан — сгенерирован одноразовый пароль админа (сохраните сейчас):",
        generated,
    )
    return generated


# Create admin user if not exists
admin = db.scalar(select(User).where(User.email == "admin@dorogadomoy.by"))
if not admin:
    admin_password = _resolve_seed_admin_password()
    admin = User(
        id="user-admin",
        email="admin@dorogadomoy.by",
        name="Администратор",
        password_hash=get_password_hash(admin_password),
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        role="admin",
        contacts={"telegram": "@admin"},
    )
    db.add(admin)
    db.commit()
    print("Admin created: admin@dorogadomoy.by (пароль — см. выше или SEED_ADMIN_PASSWORD)")

# Add sample pets if empty
if db.scalar(select(func.count()).select_from(Pet)) == 0:
    sample_pets = [
        Pet(
            id="pet-1",
            photos=["https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400"],
            animal_type="cat",
            breed="Сиамская",
            colors=["brown", "white"],
            gender="female",
            approximate_age="2 года",
            status="searching",
            description="Пропала кошка, очень ласковая. Откликается на имя Мурка.",
            city="Минск",
            location_lat=53.9006,
            location_lng=27.5590,
            author_id="user-admin",
            author_name="Администратор",
            contacts={"telegram": "@admin"},
            moderation_status="approved",
        ),
    ]
    for p in sample_pets:
        db.add(p)
    db.commit()
    print("Sample pets added")

db.close()
print("Seed complete")
