import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import engine, Base, AsyncSessionLocal
from app.models.user import User, Role, Department
from app.core.security import hash_password


async def init_models():
	async with engine.begin() as conn:
		await conn.run_sync(Base.metadata.create_all)


async def seed_admin():
	async with AsyncSessionLocal() as db:
		admin = User(email="admin@example.com", full_name="Admin", hashed_password=hash_password("admin"), is_superuser=True)
		db.add(admin)
		await db.commit()


async def init_db():
	await init_models()
	await seed_admin()


if __name__ == "__main__":
	asyncio.run(init_db())