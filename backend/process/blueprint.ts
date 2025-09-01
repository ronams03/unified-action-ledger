import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { ProcessBlueprint, ProcessStep } from "../action/types";

const actionDB = SQLDatabase.named("action_ledger");

interface CreateBlueprintRequest {
  name: string;
  description?: string;
  department?: string;
  steps: ProcessStep[];
}

interface GetBlueprintParams {
  id: string;
}

interface ListBlueprintsResponse {
  blueprints: ProcessBlueprint[];
}

// Creates a new process blueprint for standardizing workflows.
export const createBlueprint = api<CreateBlueprintRequest, ProcessBlueprint>(
  { expose: true, method: "POST", path: "/process/blueprints" },
  async (req) => {
    // TODO: Get user ID from authentication context
    const createdBy = '00000000-0000-0000-0000-000000000000'; // Placeholder

    const blueprint = await actionDB.queryRow<any>`
      INSERT INTO process_blueprints (name, description, department, steps, created_by)
      VALUES (${req.name}, ${req.description}, ${req.department}, ${JSON.stringify(req.steps)}, ${createdBy})
      RETURNING *
    `;

    if (!blueprint) {
      throw new Error("Failed to create blueprint");
    }

    return {
      id: blueprint.id,
      name: blueprint.name,
      description: blueprint.description,
      department: blueprint.department,
      steps: blueprint.steps,
      escalationRules: blueprint.escalation_rules || [],
      isActive: blueprint.is_active,
      createdBy: blueprint.created_by,
      createdAt: blueprint.created_at,
      updatedAt: blueprint.updated_at
    };
  }
);

// Retrieves a specific process blueprint by ID.
export const getBlueprint = api<GetBlueprintParams, ProcessBlueprint>(
  { expose: true, method: "GET", path: "/process/blueprints/:id" },
  async ({ id }) => {
    const blueprint = await actionDB.queryRow<any>`
      SELECT * FROM process_blueprints WHERE id = ${id}
    `;

    if (!blueprint) {
      throw APIError.notFound("Blueprint not found");
    }

    return {
      id: blueprint.id,
      name: blueprint.name,
      description: blueprint.description,
      department: blueprint.department,
      steps: blueprint.steps,
      escalationRules: blueprint.escalation_rules || [],
      isActive: blueprint.is_active,
      createdBy: blueprint.created_by,
      createdAt: blueprint.created_at,
      updatedAt: blueprint.updated_at
    };
  }
);

// Lists all available process blueprints.
export const listBlueprints = api<void, ListBlueprintsResponse>(
  { expose: true, method: "GET", path: "/process/blueprints" },
  async () => {
    const blueprints = await actionDB.queryAll<any>`
      SELECT * FROM process_blueprints 
      WHERE is_active = true
      ORDER BY name ASC
    `;

    const formattedBlueprints: ProcessBlueprint[] = blueprints.map(blueprint => ({
      id: blueprint.id,
      name: blueprint.name,
      description: blueprint.description,
      department: blueprint.department,
      steps: blueprint.steps,
      escalationRules: blueprint.escalation_rules || [],
      isActive: blueprint.is_active,
      createdBy: blueprint.created_by,
      createdAt: blueprint.created_at,
      updatedAt: blueprint.updated_at
    }));

    return { blueprints: formattedBlueprints };
  }
);
