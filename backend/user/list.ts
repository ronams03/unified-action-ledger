import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { User } from "../action/types";

const actionDB = SQLDatabase.named("action_ledger");

interface ListUsersResponse {
  users: User[];
}

// Lists all active users in the system.
export const list = api<void, ListUsersResponse>(
  { expose: true, method: "GET", path: "/users" },
  async () => {
    const users = await actionDB.queryAll<any>`
      SELECT * FROM users WHERE is_active = true ORDER BY name ASC
    `;

    const formattedUsers: User[] = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      isActive: user.is_active,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    return { users: formattedUsers };
  }
);
