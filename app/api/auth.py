from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.user import UserCreate, UserRead, Token
from app.api.deps import get_db_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db_session)):
	existing = await db.execute(select(User).where(User.email == payload.email))
	if existing.scalar_one_or_none() is not None:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
	user = User(
		email=payload.email,
		full_name=payload.full_name,
		hashed_password=hash_password(payload.password),
		is_active=True,
		is_superuser=False,
		department_id=payload.department_id,
		role_id=payload.role_id,
	)
	db.add(user)
	await db.commit()
	await db.refresh(user)
	return user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db_session)):
	result = await db.execute(select(User).where(User.email == form_data.username))
	user = result.scalar_one_or_none()
	if user is None or not verify_password(form_data.password, user.hashed_password):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
	token = create_access_token(subject=str(user.id))
	return Token(access_token=token)