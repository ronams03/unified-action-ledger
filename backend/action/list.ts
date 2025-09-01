import { api } from "encore.dev/api";
import { Query } from "encore.dev/api";
import { actionDB } from "./db";
import { ActionWithDetails, SearchQuery } from "./types";

interface ListActionsParams {
  keyword?: Query<string>;
  department?: Query<string>;
  actionType?: Query<string>;
  targetItem?: Query<string>;
  limit?: Query<number>;
  offset?: Query<number>;
}

interface ListActionsResponse {
  actions: ActionWithDetails[];
  total: number;
}

// Retrieves actions with advanced filtering and search capabilities.
export const list = api<ListActionsParams, ListActionsResponse>(
  { expose: true, method: "GET", path: "/actions" },
  async (params) => {
    const limit = params.limit || 50;
    const offset = params.offset || 0;
    
    let whereClause = "WHERE a.is_voided = false";
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (params.keyword) {
      whereClause += ` AND (a.description ILIKE $${paramIndex} OR a.target_item ILIKE $${paramIndex + 1})`;
      queryParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
      paramIndex += 2;
    }

    if (params.department) {
      whereClause += ` AND a.department = $${paramIndex}`;
      queryParams.push(params.department);
      paramIndex++;
    }

    if (params.actionType) {
      whereClause += ` AND at.name = $${paramIndex}`;
      queryParams.push(params.actionType);
      paramIndex++;
    }

    if (params.targetItem) {
      whereClause += ` AND a.target_item ILIKE $${paramIndex}`;
      queryParams.push(`%${params.targetItem}%`);
      paramIndex++;
    }

    const query = `
      SELECT 
        a.*,
        u.id as user_id, u.name as user_name, u.email as user_email, 
        u.role as user_role, u.department as user_department,
        at.id as action_type_id, at.name as action_type_name, 
        at.description as action_type_description, at.category as action_type_category
      FROM actions a
      JOIN users u ON a.user_id = u.id
      JOIN action_types at ON a.action_type_id = at.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM actions a
      JOIN users u ON a.user_id = u.id
      JOIN action_types at ON a.action_type_id = at.id
      ${whereClause}
    `;

    const actions = await actionDB.rawQueryAll(query, ...queryParams);
    const countResult = await actionDB.rawQueryRow(countQuery, ...queryParams.slice(0, -2));

    const formattedActions: ActionWithDetails[] = actions.map(row => ({
      id: row.id,
      hash: row.hash,
      prevHash: row.prev_hash,
      userId: row.user_id,
      actionTypeId: row.action_type_id,
      targetItem: row.target_item,
      targetType: row.target_type,
      department: row.department,
      contextTags: row.context_tags,
      preState: row.pre_state,
      postState: row.post_state,
      description: row.description,
      metadata: row.metadata,
      processBlueprintId: row.process_blueprint_id,
      parentActionId: row.parent_action_id,
      isVoided: row.is_voided,
      voidReason: row.void_reason,
      voidedBy: row.voided_by,
      voidedAt: row.voided_at,
      createdAt: row.created_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        role: row.user_role,
        department: row.user_department,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      actionType: {
        id: row.action_type_id,
        name: row.action_type_name,
        description: row.action_type_description,
        category: row.action_type_category
      }
    }));

    return {
      actions: formattedActions,
      total: countResult?.total || 0
    };
  }
);
