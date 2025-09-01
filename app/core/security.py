from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext

from .config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
	if expires_delta is None:
		expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
	expire = datetime.now(tz=timezone.utc) + expires_delta
	to_encode = {"sub": subject, "exp": expire}
	encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)
	return encoded_jwt