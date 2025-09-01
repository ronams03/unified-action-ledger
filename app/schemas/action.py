from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any


class ActionBase(BaseModel):
	action_type: str
	reference_key: Optional[str] = None
	target_type: Optional[str] = None
	target_id: Optional[str] = None
	target_label: Optional[str] = None
	context_tags: Optional[Dict[str, Any]] = None
	pre_state: Optional[Dict[str, Any]] = None
	post_state: Optional[Dict[str, Any]] = None
	local_timestamp: Optional[datetime] = None
	department_id: Optional[int] = None
	is_offline_capture: bool = False
	device_id: Optional[str] = None


class ActionCreate(ActionBase):
	pass


class ActionRead(ActionBase):
	id: int
	sequence: Optional[int] = None
	created_at: datetime
	created_by_user_id: int
	prev_hash: Optional[str] = None
	entry_hash: Optional[str] = None
	voided: bool
	void_reason: Optional[str] = None
	voided_by_user_id: Optional[int] = None
	voided_at: Optional[datetime] = None

	class Config:
		from_attributes = True


class ActionLinkCreate(BaseModel):
	source_action_id: int
	target_action_id: int
	link_type: str