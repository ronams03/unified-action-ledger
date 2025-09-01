from datetime import datetime
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Rule(Base):
	__tablename__ = "rules"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	name: Mapped[str] = mapped_column(String(255), nullable=False)
	description: Mapped[str | None] = mapped_column(Text)
	action_type: Mapped[str | None] = mapped_column(String(50), index=True)
	reference_prefix: Mapped[str | None] = mapped_column(String(50), index=True)
	department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), index=True)
	threshold_hours: Mapped[int] = mapped_column(Integer, default=48)
	notify_role: Mapped[str | None] = mapped_column(String(50))
	notify_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
	channel: Mapped[str] = mapped_column(String(20), default="email")
	active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	department = relationship("Department")


class EscalationEvent(Base):
	__tablename__ = "escalation_events"

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	rule_id: Mapped[int] = mapped_column(ForeignKey("rules.id"), nullable=False)
	reference_key: Mapped[str | None] = mapped_column(String(255), index=True)
	action_id: Mapped[int | None] = mapped_column(ForeignKey("actions.id"), index=True)
	message: Mapped[str] = mapped_column(Text)
	channel: Mapped[str] = mapped_column(String(20))
	sent_to: Mapped[str | None] = mapped_column(String(255))
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	rule = relationship("Rule")