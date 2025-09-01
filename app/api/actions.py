from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_subject
from app.core.ledger import compute_entry_hash
from app.models.action import Action, ActionLink
from app.models.user import User
from app.schemas.action import ActionCreate, ActionRead, ActionLinkCreate

router = APIRouter(prefix="/actions", tags=["actions"])


async def _get_prev_hash(db: AsyncSession) -> Optional[str]:
	result = await db.execute(select(Action.entry_hash).order_by(desc(Action.id)).limit(1))
	return result.scalar_one_or_none()


@router.post("/", response_model=ActionRead)
async def create_action(payload: ActionCreate, db: AsyncSession = Depends(get_db_session), subject: str = Depends(get_current_subject)):
	user_id = int(subject)
	prev_hash = await _get_prev_hash(db)
	payload_dict = payload.model_dump()
	payload_dict.update({
		"created_by_user_id": user_id,
		"created_at": datetime.utcnow().isoformat(),
	})
	entry_hash = compute_entry_hash(payload_dict, prev_hash)
	action = Action(
		action_type=payload.action_type,
		reference_key=payload.reference_key,
		target_type=payload.target_type,
		target_id=payload.target_id,
		target_label=payload.target_label,
		context_tags=payload.context_tags,
		pre_state=payload.pre_state,
		post_state=payload.post_state,
		local_timestamp=payload.local_timestamp,
		department_id=payload.department_id,
		is_offline_capture=payload.is_offline_capture,
		device_id=payload.device_id,
		created_by_user_id=user_id,
		prev_hash=prev_hash,
		entry_hash=entry_hash,
	)
	db.add(action)
	await db.commit()
	await db.refresh(action)
	return action


@router.post("/link", status_code=201)
async def link_actions(link: ActionLinkCreate, db: AsyncSession = Depends(get_db_session), subject: str = Depends(get_current_subject)):
	if link.source_action_id == link.target_action_id:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot link an action to itself")
	link_row = ActionLink(
		source_action_id=link.source_action_id,
		target_action_id=link.target_action_id,
		link_type=link.link_type,
	)
	db.add(link_row)
	await db.commit()
	return {"status": "linked"}


@router.post("/{action_id}/void", response_model=ActionRead)
async def void_action(action_id: int, reason: str, db: AsyncSession = Depends(get_db_session), subject: str = Depends(get_current_subject)):
	result = await db.execute(select(Action).where(Action.id == action_id))
	action = result.scalar_one_or_none()
	if action is None:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")
	if action.voided:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action already voided")
	action.voided = True
	action.void_reason = reason
	action.voided_by_user_id = int(subject)
	action.voided_at = datetime.utcnow()
	await db.commit()
	await db.refresh(action)
	return action


@router.get("/timeline/{reference_key}", response_model=list[ActionRead])
async def get_timeline(reference_key: str, db: AsyncSession = Depends(get_db_session), subject: str = Depends(get_current_subject)):
	result = await db.execute(select(Action).where(Action.reference_key == reference_key).order_by(Action.created_at.asc()))
	return list(result.scalars().all())