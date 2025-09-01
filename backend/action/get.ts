import { api, APIError } from "encore.dev/api";
import { actionDB } from "./db";
import { ActionWithDetails } from "./types";

interface GetActionParams {
  id: string;
}

// Retrieves a specific action with all related details and dependencies.
export const get = api<GetActionParams, ActionWithDetails>(
  { expose: true, method: "GET", path: "/actions/:id" },
  async ({ id }) => {
    const action = await actionDB.queryRow<any>`
      SELECT 
        a.*,
        u.id as user_id, u.name as user_name, u.email as user_email, 
        u.role as user_role, u.department as user_department,
        at.id as action_type_id, at.name as action_type_name, 
        at.description as action_type_description, at.category as action_type_category
      FROM actions a
      JOIN users u ON a.user_id = u.id
      JOIN action_types at ON a.action_type_id = at.id
      WHERE a.id = ${id}
    `;

    if (!action) {
      throw APIError.notFound("Action not found");
    }

    // Get dependencies
    const dependencies = await actionDB.queryAll<any>`
      SELECT ad.*, a.target_item, a.description, a.created_at as action_created_at
      FROM action_dependencies ad
      JOIN actions a ON ad.target_action_id = a.id
      WHERE ad.source_action_id = ${id}
    `;

    const formattedAction: ActionWithDetails = {
      id: action.id,
      hash: action.hash,
      prevHash: action.prev_hash,
      userId: action.user_id,
      actionTypeId: action.action_type_id,
      targetItem: action.target_item,
      targetType: action.target_type,
      department: action.department,
      contextTags: action.context_tags,
      preState: action.pre_state,
      postState: action.post_state,
      description: action.description,
      metadata: action.metadata,
      processBlueprintId: action.process_blueprint_id,
      parentActionId: action.parent_action_id,
      isVoided: action.is_voided,
      voidReason: action.void_reason,
      voidedBy: action.voided_by,
      voidedAt: action.voided_at,
      createdAt: action.created_at,
      user: {
        id: action.user_id,
        name: action.user_name,
        email: action.user_email,
        role: action.user_role,
        department: action.user_department,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      actionType: {
        id: action.action_type_id,
        name: action.action_type_name,
        description: action.action_type_description,
        category: action.action_type_category
      },
      dependencies: dependencies.map(dep => ({
        id: dep.id,
        sourceActionId: dep.source_action_id,
        targetActionId: dep.target_action_id,
        dependencyType: dep.dependency_type,
        createdAt: dep.created_at
      }))
    };

    return formattedAction;
  }
);
