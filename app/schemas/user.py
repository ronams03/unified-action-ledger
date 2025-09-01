from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
	email: EmailStr
	full_name: Optional[str] = None
	is_active: bool = True
	is_superuser: bool = False
	department_id: Optional[int] = None
	role_id: Optional[int] = None


class UserCreate(UserBase):
	password: str


class UserRead(UserBase):
	id: int

	class Config:
		from_attributes = True


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"