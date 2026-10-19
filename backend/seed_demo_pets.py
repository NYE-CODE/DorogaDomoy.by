"""Добавляет 30 демо-объявлений lost/found по городам Беларуси (идемпотентно по id)."""
from __future__ import annotations

import random
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

from sqlalchemy import select

from auth import get_password_hash
from database import SessionLocal, init_db
from models import Pet, User

init_db()
db = SessionLocal()

ADMIN_ID = "user-admin"
ADMIN_EMAIL = "admin@dorogadomoy.by"

CITIES: list[tuple[str, float, float]] = [
    ("Минск", 53.9006, 27.5590),
    ("Брест", 52.0976, 23.7340),
    ("Витебск", 55.1904, 30.2049),
    ("Гомель", 52.4345, 30.9754),
    ("Гродно", 53.6693, 23.8131),
    ("Могилёв", 53.9007, 30.3313),
    ("Барановичи", 53.1327, 26.0139),
    ("Пинск", 52.1115, 26.1032),
    ("Орша", 54.5081, 30.4172),
    ("Мозырь", 52.0488, 29.2456),
    ("Лида", 53.8833, 25.2997),
    ("Бобруйск", 53.1384, 29.2214),
    ("Борисов", 54.2279, 28.5050),
    ("Солигорск", 52.7906, 27.5407),
    ("Молодечно", 54.3103, 26.8535),
    ("Полоцк", 55.4879, 28.7856),
    ("Новополоцк", 55.5318, 28.6583),
    ("Жлобин", 52.8918, 30.0240),
    ("Слуцк", 53.0275, 27.5597),
    ("Кобрин", 52.2139, 24.3564),
    ("Речица", 52.3618, 30.3918),
    ("Слоним", 53.0868, 25.3167),
    ("Волковыск", 53.1567, 24.4417),
    ("Жодино", 54.0981, 28.3392),
    ("Светлогорск", 52.6270, 29.7388),
    ("Калинковичи", 52.1284, 29.3270),
    ("Сморгонь", 54.4833, 26.4000),
    ("Осиповичи", 53.3011, 28.6356),
    ("Дзержинск", 53.6833, 27.1333),
    ("Фаниполь", 53.7500, 27.3333),
]

DOG_PHOTOS = [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800",
    "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800",
    "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800",
    "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800",
]
CAT_PHOTOS = [
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
    "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800",
    "https://images.unsplash.com/photo-1511044567668-c1f4b4a3f1c0?w=800",
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800",
    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800",
]

DOG_BREEDS = [
    "Дворняжка",
    "Лабрадор",
    "Овчарка",
    "Такса",
    "Хаски",
    "Шпиц",
    "Спаниель",
    "Бультерьер",
]
CAT_BREEDS = [
    "Дворовая",
    "Сиамская",
    "Британская",
    "Мейн-кун",
    "Персидская",
    "Рыжая",
]

COLORS = [
    ["black"],
    ["white"],
    ["gray"],
    ["brown"],
    ["red"],
    ["mixed"],
    ["spotted"],
    ["black", "white"],
    ["brown", "white"],
    ["gray", "white"],
]

AGES = ["щенок / котёнок", "около 1 года", "2 года", "3–4 года", "более 5 лет", "взрослый"]
GENDERS = ["male", "female", "unknown"]
STATUSES = ["searching", "searching", "searching", "found"]  # чаще «ищут»

NAMES = [
    "Барсик",
    "Мурка",
    "Рекс",
    "Луна",
    "Шарик",
    "Мия",
    "Дружок",
    "Соня",
    "Тима",
    "Зоя",
    "Бим",
    "Астра",
    "Кузя",
    "Ника",
    "Джек",
]


def ensure_admin() -> User:
    admin = db.scalar(select(User).where(User.id == ADMIN_ID))
    if admin:
        return admin
    admin = db.scalar(select(User).where(User.email == ADMIN_EMAIL))
    if admin:
        return admin
    admin = User(
        id=ADMIN_ID,
        email=ADMIN_EMAIL,
        name="Администратор",
        password_hash=get_password_hash("change-me-demo"),
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        role="admin",
        contacts={"telegram": "@admin"},
    )
    db.add(admin)
    db.commit()
    print("Created admin user-admin")
    return admin


def jitter(lat: float, lng: float, i: int) -> tuple[float, float]:
    """Небольшой сдвиг координат, чтобы маркеры не накладывались."""
    return (
        lat + ((i % 7) - 3) * 0.012,
        lng + ((i % 5) - 2) * 0.018,
    )


def main() -> None:
    rng = random.Random(42)
    admin = ensure_admin()
    now = datetime.utcnow()
    added = 0
    skipped = 0

    for i in range(1, 31):
        pet_id = f"seed-pet-{i:02d}"
        existing = db.get(Pet, pet_id)
        if existing:
            skipped += 1
            continue

        city_name, lat0, lng0 = CITIES[(i - 1) % len(CITIES)]
        lat, lng = jitter(lat0, lng0, i)
        is_dog = i % 3 != 0
        animal_type = "dog" if is_dog else "cat"
        breed = rng.choice(DOG_BREEDS if is_dog else CAT_BREEDS)
        photo = rng.choice(DOG_PHOTOS if is_dog else CAT_PHOTOS)
        status = STATUSES[i % len(STATUSES)]
        name = NAMES[(i - 1) % len(NAMES)]
        gender = GENDERS[i % len(GENDERS)]
        colors = COLORS[i % len(COLORS)]
        age = AGES[i % len(AGES)]
        days_ago = (i * 2) % 21
        published = now - timedelta(days=days_ago, hours=i % 12)

        if status == "searching":
            description = (
                f"Пропал{'' if gender != 'female' else 'а'} {('пёс' if is_dog else 'кот') if gender != 'female' else ('собака' if is_dog else 'кошка')} "
                f"по кличке {name}. Порода: {breed}. "
                f"Если видели в районе {city_name} — напишите, пожалуйста."
            )
        else:
            description = (
                f"Найден{'' if gender != 'female' else 'а'} {('пёс' if is_dog else 'кот') if gender != 'female' else ('собака' if is_dog else 'кошка')} "
                f"в {city_name}. Похож{'а' if gender == 'female' else ''} на {breed}. "
                f"Ищем хозяина — откликнитесь, если узнали."
            )

        pet = Pet(
            id=pet_id,
            photos=[photo],
            animal_type=animal_type,
            breed=breed,
            colors=colors,
            gender=gender,
            approximate_age=age,
            status=status,
            description=description,
            distinctive_marks=[f"Кличка / откликается: {name}"] if status == "searching" else [],
            city=city_name,
            location_lat=lat,
            location_lng=lng,
            published_at=published,
            expires_at=published + timedelta(days=90),
            updated_at=published,
            author_id=admin.id,
            author_name=admin.name,
            contacts={"telegram": "@admin"},
            is_archived=False,
            moderation_status="approved",
            reward_mode="points",
            reward_points=50,
            pet_scope="lost_found",
            is_published=True,
        )
        db.add(pet)
        added += 1

    db.commit()
    print(f"Done: added={added}, skipped_existing={skipped}")


if __name__ == "__main__":
    try:
        main()
    finally:
        db.close()
