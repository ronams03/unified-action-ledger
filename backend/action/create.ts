import { api } from "encore.dev/api";
import { actionDB } from "./db";
import { CreateActionRequest, Action } from "./types";
import { createHash } from "crypto";

// Creates a new action in the ledger with tamper-evident hash chaining.
export const create = api<CreateActionRequest, Action>(
  { expose: true, method: "POST", path: "/actions" },
  async (req) => {
    // Get the previous action's hash for chaining
    const prevAction = await actionDB.queryRow<{ hash: string }>`
      SELECT hash FROM actions 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    // Create a unique hash for this action
    const actionData = JSON.stringify({
      ...req,
      timestamp: Date.now(),
      prevHash: prevAction?.hash
    });
    const hash = createHash('sha256').update(actionData).digest('hex');

    // TODO: Get user ID from authentication context
    const userId = '00000000-0000-0000-0000-000000000000'; // Placeholder

    const action = await actionDB.queryRow<Action>`
      INSERT INTO actions (
        hash, prev_hash, user_id, action_type_id, target_item, target_type,
        department, context_tags, pre_state, post_state, description,
        metadata, process_blueprint_id, parent_action_id
      ) VALUES (
        ${hash}, ${prevAction?.hash || null}, ${userId}, ${req.actionTypeId},
        ${req.targetItem}, ${req.targetType}, ${req.department},
        ${JSON.stringify(req.contextTags || {})}, ${req.preState}, ${req.postState},
        ${req.description}, ${JSON.stringify(req.metadata || {})},
        ${req.processBlueprintId}, ${req.parentActionId}
      )
      RETURNING *
    `;

    if (!action) {
      throw new Error("Failed to create action");
    }

    return {
      ...action,
      contextTags: action.context_tags,
      preState: action.pre_state,
      postState: action.post_state,
      processBlueprintId: action.process_blueprint_id,
      parentActionId: action.parent_action_id,
      isVoided: action.is_voided,
      voidReason: action.void_reason,
      voidedBy: action.voided_by,
      voidedAt: action.voided_at,
      createdAt: action.created_at
    };
  }
);
