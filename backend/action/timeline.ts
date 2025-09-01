import { api } from "encore.dev/api";
import { actionDB } from "./db";
import { TimelineEvent } from "./types";

interface GetTimelineParams {
  targetItem: string;
}

interface GetTimelineResponse {
  events: TimelineEvent[];
}

// Retrieves the complete timeline of actions for a specific target item.
export const getTimeline = api<GetTimelineParams, GetTimelineResponse>(
  { expose: true, method: "GET", path: "/timeline/:targetItem" },
  async ({ targetItem }) => {
    const actions = await actionDB.queryAll<any>`
      SELECT 
        a.*,
        u.id as user_id, u.name as user_name, u.email as user_email, 
        u.role as user_role, u.department as user_department,
        at.id as action_type_id, at.name as action_type_name, 
        at.description as action_type_description, at.category as action_type_category
      FROM actions a
      JOIN users u ON a.user_id = u.id
      JOIN action_types at ON a.action_type_id = at.id
      WHERE a.target_item = ${targetItem} AND a.is_voided = false
      ORDER BY a.created_at ASC
    `;

    const events: TimelineEvent[] = [];

    for (const action of actions) {
      // Get dependencies for this action
      const dependencies = await actionDB.queryAll<any>`
        SELECT 
          ad.*,
          a.id, a.hash, a.target_item, a.target_type, a.department,
          a.description, a.created_at,
          u.name as user_name, u.email as user_email,
          at.name as action_type_name, at.category as action_type_category
        FROM action_dependencies ad
        JOIN actions a ON ad.target_action_id = a.id
        JOIN users u ON a.user_id = u.id
        JOIN action_types at ON a.action_type_id = at.id
        WHERE ad.source_action_id = ${action.id}
      `;

      // Get related actions (same target item, different action)
      const relatedActions = await actionDB.queryAll<any>`
        SELECT 
          a.*,
          u.name as user_name, u.email as user_email,
          at.name as action_type_name, at.category as action_type_category
        FROM actions a
        JOIN users u ON a.user_id = u.id
        JOIN action_types at ON a.action_type_id = at.id
        WHERE a.target_item = ${targetItem} 
          AND a.id != ${action.id}
          AND a.is_voided = false
          AND ABS(EXTRACT(EPOCH FROM (a.created_at - '${action.created_at}'::timestamptz))) < 3600
        ORDER BY a.created_at
        LIMIT 5
      `;

      const event: TimelineEvent = {
        action: {
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
          }
        },
        dependencies: dependencies.map(dep => ({
          id: dep.id,
          hash: dep.hash,
          prevHash: null,
          userId: dep.user_id,
          actionTypeId: dep.action_type_id,
          targetItem: dep.target_item,
          targetType: dep.target_type,
          department: dep.department,
          contextTags: {},
          description: dep.description,
          metadata: {},
          isVoided: false,
          createdAt: dep.created_at,
          user: {
            id: dep.user_id,
            name: dep.user_name,
            email: dep.user_email,
            role: '',
            department: '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          actionType: {
            id: dep.action_type_id,
            name: dep.action_type_name,
            description: '',
            category: dep.action_type_category
          }
        })),
        relatedActions: relatedActions.map(rel => ({
          id: rel.id,
          hash: rel.hash,
          prevHash: rel.prev_hash,
          userId: rel.user_id,
          actionTypeId: rel.action_type_id,
          targetItem: rel.target_item,
          targetType: rel.target_type,
          department: rel.department,
          contextTags: rel.context_tags,
          preState: rel.pre_state,
          postState: rel.post_state,
          description: rel.description,
          metadata: rel.metadata,
          processBlueprintId: rel.process_blueprint_id,
          parentActionId: rel.parent_action_id,
          isVoided: rel.is_voided,
          voidReason: rel.void_reason,
          voidedBy: rel.voided_by,
          voidedAt: rel.voided_at,
          createdAt: rel.created_at,
          user: {
            id: rel.user_id,
            name: rel.user_name,
            email: rel.user_email,
            role: '',
            department: '',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          actionType: {
            id: rel.action_type_id,
            name: rel.action_type_name,
            description: '',
            category: rel.action_type_category
          }
        }))
      };

      events.push(event);
    }

    return { events };
  }
);
