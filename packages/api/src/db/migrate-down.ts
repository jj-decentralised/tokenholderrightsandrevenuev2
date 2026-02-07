import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query, getClient } from "./connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function migrateDown(): Promise<void> {
  const result = await query<{ name: string }>(
    "SELECT name FROM _migrations ORDER BY id DESC LIMIT 1"
  );
  if (result.rows.length === 0) {
    console.log("No migrations to rollback.");
    process.exit(0);
  }

  const lastMigration = result.rows[0].name;
  const filePath = path.join(MIGRATIONS_DIR, lastMigration);
  const sql = fs.readFileSync(filePath, "utf-8");
  const parts = sql.split("-- Down");
  if (parts.length < 2) {
    console.error(`No -- Down section found in ${lastMigration}`);
    process.exit(1);
  }

  const downSection = parts[1];
  const client = await getClient();
  try {
    await client.query("BEGIN");
    await client.query(downSection);
    await client.query("DELETE FROM _migrations WHERE name = $1", [lastMigration]);
    await client.query("COMMIT");
    console.log(`  rolled back: ${lastMigration}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`  ROLLBACK FAILED: ${lastMigration}`, error);
    throw error;
  } finally {
    client.release();
  }

  process.exit(0);
}

migrateDown().catch((err) => {
  console.error("Rollback failed:", err);
  process.exit(1);
});
