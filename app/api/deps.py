from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_session


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_db_session() -> AsyncSession:
	async for session in get_session():
		return session


async def get_current_subject(token: Annotated[str, Depends(oauth2_scheme)]) -> str:
	try:
		payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
		subject: str = payload.get("sub")
		if subject is None:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
		return subject
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")