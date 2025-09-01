import { SQLDatabase } from "encore.dev/storage/sqldb";

export const actionDB = new SQLDatabase("action_ledger", {
  migrations: "./migrations",
});
