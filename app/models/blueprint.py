from datetime import datetime, timedelta
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Blueprint(Base):
	__tablename__ = "blueprints"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
	description: Mapped[str | None] = mapped_column(Text)
	owner_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	steps = relationship("BlueprintStep", back_populates="blueprint", cascade="all, delete-orphan")


class BlueprintStep(Base):
	__tablename__ = "blueprint_steps"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	blueprint_id: Mapped[int] = mapped_column(ForeignKey("blueprints.id"), nullable=False, index=True)
	order_index: Mapped[int] = mapped_column(Integer, nullable=False)
	step_name: Mapped[str] = mapped_column(String(255), nullable=False)
	expected_action_type: Mapped[str | None] = mapped_column(String(50))
	sla_hours: Mapped[int | None] = mapped_column(Integer)

	blueprint = relationship("Blueprint", back_populates="steps")


class ProcessInstance(Base):
	__tablename__ = "process_instances"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	blueprint_id: Mapped[int] = mapped_column(ForeignKey("blueprints.id"), nullable=False, index=True)
	reference_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
	created_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
	status: Mapped[str] = mapped_column(String(20), default="active")
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	blueprint = relationship("Blueprint")
	steps = relationship("ProcessStepInstance", back_populates="process", cascade="all, delete-orphan")


class ProcessStepInstance(Base):
	__tablename__ = "process_step_instances"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	process_id: Mapped[int] = mapped_column(ForeignKey("process_instances.id"), nullable=False, index=True)
	blueprint_step_id: Mapped[int] = mapped_column(ForeignKey("blueprint_steps.id"), nullable=False)
	status: Mapped[str] = mapped_column(String(20), default="waiting")
	due_at: Mapped[datetime | None] = mapped_column(DateTime)
	completed_action_id: Mapped[int | None] = mapped_column(ForeignKey("actions.id"))

	process = relationship("ProcessInstance", back_populates="steps")