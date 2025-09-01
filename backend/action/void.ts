import { api, APIError } from "encore.dev/api";
import { actionDB } from "./db";

interface VoidActionRequest {
  id: string;
  reason: string;
}

interface VoidActionResponse {
  success: boolean;
}

// Voids an action with audit trail (actions cannot be deleted, only voided).
export const voidAction = api<VoidActionRequest, VoidActionResponse>(
  { expose: true, method: "POST", path: "/actions/:id/void" },
  async (req) => {
    // TODO: Get user ID from authentication context
    const voidedBy = '00000000-0000-0000-0000-000000000000'; // Placeholder

    const result = await actionDB.queryRow<{ id: string }>`
      UPDATE actions 
      SET 
        is_voided = true,
        void_reason = ${req.reason},
        voided_by = ${voidedBy},
        voided_at = NOW()
      WHERE id = ${req.id} AND is_voided = false
      RETURNING id
    `;

    if (!result) {
      throw APIError.notFound("Action not found or already voided");
    }

    return { success: true };
  }
);
