import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ProcessStatus } from "../action/types";

const actionDB = SQLDatabase.named("action_ledger");

interface GetProcessStatusParams {
  blueprintId: string;
  targetItem: string;
}

// Retrieves the current status of a process instance against its blueprint.
export const getProcessStatus = api<GetProcessStatusParams, ProcessStatus>(
  { expose: true, method: "GET", path: "/process/:blueprintId/status/:targetItem" },
  async ({ blueprintId, targetItem }) => {
    // Get the blueprint
    const blueprint = await actionDB.queryRow<any>`
      SELECT * FROM process_blueprints WHERE id = ${blueprintId}
    `;

    if (!blueprint) {
      throw new Error("Blueprint not found");
    }

    // Get all actions for this target item within this process
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
      WHERE a.target_item = ${targetItem} 
        AND a.process_blueprint_id = ${blueprintId}
        AND a.is_voided = false
      ORDER BY a.created_at ASC
    `;

    const steps = blueprint.steps as any[];
    const totalSteps = steps.length;
    
    // Calculate completed steps based on actions
    const completedSteps = actions.filter(action => 
      action.post_state === 'completed' || action.post_state === 'approved'
    ).length;

    // Determine current step
    const currentStep = steps.find((step, index) => {
      const stepActions = actions.filter(action => 
        action.description?.includes(step.name) || 
        action.context_tags?.stepId === step.id
      );
      return stepActions.length === 0 || stepActions.some(a => 
        a.post_state === 'pending' || a.post_state === 'in_progress'
      );
    })?.name;

    // Check if process is overdue
    const processStartTime = actions.length > 0 ? new Date(actions[0].created_at) : new Date();
    const expectedDuration = steps.reduce((total, step) => total + (step.expectedDuration || 24), 0);
    const expectedCompletion = new Date(processStartTime.getTime() + expectedDuration * 60 * 60 * 1000);
    const isOverdue = new Date() > expectedCompletion && completedSteps < totalSteps;

    const formattedActions = actions.map(action => ({
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
    }));

    return {
      blueprintId,
      blueprintName: blueprint.name,
      totalSteps,
      completedSteps,
      currentStep,
      isOverdue,
      estimatedCompletion: expectedCompletion,
      actions: formattedActions
    };
  }
);
