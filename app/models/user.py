from datetime import datetime
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Department(Base):
	__tablename__ = "departments"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	users = relationship("User", back_populates="department")


class Role(Base):
	__tablename__ = "roles"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
	description: Mapped[str | None] = mapped_column(Text)

	users = relationship("User", back_populates="role")


class User(Base):
	__tablename__ = "users"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
	full_name: Mapped[str | None] = mapped_column(String(255))
	hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
	is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
	is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
	department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
	role_id: Mapped[int | None] = mapped_column(ForeignKey("roles.id"))
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	department = relationship("Department", back_populates="users")
	role = relationship("Role", back_populates="users")


class AccessLog(Base):
	__tablename__ = "access_logs"

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
	action: Mapped[str] = mapped_column(String(50), nullable=False)
	target: Mapped[str] = mapped_column(String(512), nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
	ip_address: Mapped[str | None] = mapped_column(String(64))
	user_agent: Mapped[str | None] = mapped_column(String(256))