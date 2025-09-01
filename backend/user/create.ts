import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { User } from "../action/types";

const actionDB = SQLDatabase.named("action_ledger");

interface CreateUserRequest {
  email: string;
  name: string;
  role: string;
  department: string;
}

// Creates a new user in the system.
export const create = api<CreateUserRequest, User>(
  { expose: true, method: "POST", path: "/users" },
  async (req) => {
    const user = await actionDB.queryRow<any>`
      INSERT INTO users (email, name, role, department)
      VALUES (${req.email}, ${req.name}, ${req.role}, ${req.department})
      RETURNING *
    `;

    if (!user) {
      throw new Error("Failed to create user");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  }
);
