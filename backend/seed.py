"""Seed database with initial admin user and sample data."""
from database import init_db, SessionLocal
from models import User, Pet, Report
from auth import get_password_hash

init_db()
db = SessionLocal()

# Create admin user if not exists
admin = db.query(User).filter(User.email == "admin@dorogadomoy.by").first()
if not admin:
    admin = User(
        id="user-admin",
        email="admin@dorogadomoy.by",
        name="Администратор",
        password_hash=get_password_hash("admin123"),
        avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
        role="admin",
        contacts={"phone": "+375291234567", "telegram": "@admin"},
    )
    db.add(admin)
    db.commit()
    print("Admin created: admin@dorogadomoy.by / admin123")

# Add sample pets if empty
if db.query(Pet).count() == 0:
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
            contacts={"telegram": "@admin", "phone": "+375291234567"},
            moderation_status="approved",
        ),
    ]
    for p in sample_pets:
        db.add(p)
    db.commit()
    print("Sample pets added")

db.close()
print("Seed complete")
