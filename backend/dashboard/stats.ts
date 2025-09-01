import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { DashboardStats } from "../action/types";

const actionDB = SQLDatabase.named("action_ledger");

// Retrieves dashboard statistics and metrics for the overview.
export const getStats = api<void, DashboardStats>(
  { expose: true, method: "GET", path: "/dashboard/stats" },
  async () => {
    const today = new Date().toISOString().split('T')[0];

    // Get total actions
    const totalResult = await actionDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM actions WHERE is_voided = false
    `;

    // Get actions today
    const todayResult = await actionDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM actions 
      WHERE is_voided = false AND DATE(created_at) = ${today}
    `;

    // Get pending actions (actions waiting for follow-up)
    const pendingResult = await actionDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM actions a
      WHERE a.is_voided = false 
        AND a.post_state IN ('pending', 'waiting', 'in_progress')
        AND NOT EXISTS (
          SELECT 1 FROM actions a2 
          WHERE a2.parent_action_id = a.id 
            AND a2.is_voided = false 
            AND a2.post_state IN ('completed', 'approved', 'resolved')
        )
    `;

    // Get overdue actions (based on expected completion times)
    const overdueResult = await actionDB.queryRow<{ count: number }>`
      SELECT COUNT(*) as count FROM actions a
      WHERE a.is_voided = false 
        AND a.post_state IN ('pending', 'waiting', 'in_progress')
        AND a.created_at < NOW() - INTERVAL '48 hours'
    `;

    // Get department breakdown
    const departmentBreakdown = await actionDB.queryAll<{ department: string; count: number }>`
      SELECT department, COUNT(*) as count
      FROM actions 
      WHERE is_voided = false AND DATE(created_at) = ${today}
      GROUP BY department
      ORDER BY count DESC
    `;

    // Get action type breakdown
    const actionTypeBreakdown = await actionDB.queryAll<{ name: string; count: number }>`
      SELECT at.name, COUNT(*) as count
      FROM actions a
      JOIN action_types at ON a.action_type_id = at.id
      WHERE a.is_voided = false AND DATE(a.created_at) = ${today}
      GROUP BY at.name
      ORDER BY count DESC
    `;

    const departmentBreakdownMap: Record<string, number> = {};
    departmentBreakdown.forEach(item => {
      departmentBreakdownMap[item.department] = item.count;
    });

    const actionTypeBreakdownMap: Record<string, number> = {};
    actionTypeBreakdown.forEach(item => {
      actionTypeBreakdownMap[item.name] = item.count;
    });

    return {
      totalActions: totalResult?.count || 0,
      actionsToday: todayResult?.count || 0,
      pendingActions: pendingResult?.count || 0,
      overdueActions: overdueResult?.count || 0,
      departmentBreakdown: departmentBreakdownMap,
      actionTypeBreakdown: actionTypeBreakdownMap
    };
  }
);
