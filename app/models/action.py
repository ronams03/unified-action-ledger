from datetime import datetime
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime, Text, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Action(Base):
	__tablename__ = "actions"
	__table_args__ = (
		UniqueConstraint("sequence", name="uq_actions_sequence"),
	)

	id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
	sequence: Mapped[int] = mapped_column(Integer, autoincrement=True, unique=True, index=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
	local_timestamp: Mapped[datetime | None] = mapped_column(DateTime)
	created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
	department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), index=True)
	action_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

	reference_key: Mapped[str | None] = mapped_column(String(255), index=True)  # e.g., PO-1023
	target_type: Mapped[str | None] = mapped_column(String(100), index=True)
	target_id: Mapped[str | None] = mapped_column(String(255), index=True)
	target_label: Mapped[str | None] = mapped_column(String(255))

	context_tags: Mapped[dict | None] = mapped_column(JSON)
	pre_state: Mapped[dict | None] = mapped_column(JSON)
	post_state: Mapped[dict | None] = mapped_column(JSON)

	prev_hash: Mapped[str | None] = mapped_column(String(128), index=True)
	entry_hash: Mapped[str | None] = mapped_column(String(128), index=True)

	is_offline_capture: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
	device_id: Mapped[str | None] = mapped_column(String(128))

	voided: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
	void_reason: Mapped[str | None] = mapped_column(Text)
	voided_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
	voided_at: Mapped[datetime | None] = mapped_column(DateTime)

	created_by_user = relationship("User", foreign_keys=[created_by_user_id])
	department = relationship("Department")
	voided_by_user = relationship("User", foreign_keys=[voided_by_user_id])


class ActionLink(Base):
	__tablename__ = "action_links"
	__table_args__ = (
		UniqueConstraint("source_action_id", "target_action_id", "link_type", name="uq_action_link_unique"),
	)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	source_action_id: Mapped[int] = mapped_column(ForeignKey("actions.id"), nullable=False, index=True)
	target_action_id: Mapped[int] = mapped_column(ForeignKey("actions.id"), nullable=False, index=True)
	link_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

	source_action = relationship("Action", foreign_keys=[source_action_id])
	target_action = relationship("Action", foreign_keys=[target_action_id])


class FollowSubscription(Base):
	__tablename__ = "follow_subscriptions"
	__table_args__ = (
		UniqueConstraint("user_id", "reference_key", name="uq_follow_unique"),
	)

	id: Mapped[int] = mapped_column(Integer, primary_key=True)
	user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
	reference_key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
	created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)