import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { query, getClient } from "./connection.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await query<{ name: string }>(
    "SELECT name FROM _migrations ORDER BY id"
  );
  return result.rows.map((r) => r.name);
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let newMigrations = 0;
  for (const file of files) {
    if (applied.includes(file)) {
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf-8");
    const upSection = sql.split("-- Down")[0];

    const client = await getClient();
    try {
      await client.query("BEGIN");
      await client.query(upSection);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`  [migrate] applied: ${file}`);
      newMigrations++;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`  [migrate] FAILED: ${file}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  if (newMigrations > 0) {
    console.log(`[migrate] ${newMigrations} migrations applied.`);
  } else {
    console.log("[migrate] Database is up to date.");
  }
}

// CLI entrypoint
const isMainModule = process.argv[1]?.includes("migrate") && !process.argv[1]?.includes("migrate-down");
if (isMainModule) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
