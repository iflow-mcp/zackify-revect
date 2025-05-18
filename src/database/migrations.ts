import { db } from "./database";

// Migration type definition
type Migration = {
  name: string;
  up: () => void;
  down: () => void;
};

// Initialize database and migrations table
async function initMigrationsTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Get list of applied migrations
async function getAppliedMigrations(): Promise<string[]> {
  const result = db.query(`SELECT name FROM migrations ORDER BY id ASC`).all();
  return result.map((row: any) => row.name);
}

// Example migrations array
const migrations: Migration[] = [
  {
    name: "create_users_table",
    up: () => {
      return db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
    down: () => {
      return db.exec(`DROP TABLE users;`);
    },
  },
  {
    name: "create_documents_table",
    up: () => {
      return db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id SERIAL PRIMARY KEY,
          external_id VARCHAR UNIQUE,
          text TEXT,
          metadata JSONB,
          embeddings float[1024],
          source VARCHAR,
          created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);
    },
    down: () => {
      return db.exec(`DROP TABLE documents;`);
    },
  },
  {
    name: "create_document_chunks_table",
    up: () => {
      return db.exec(`
        CREATE TABLE IF NOT EXISTS document_chunks (
          id SERIAL PRIMARY KEY,
          document_id INTEGER,
          text TEXT,
          embeddings float[1024],
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES documents(id)
        );
      `);
    },
    down: () => {
      return db.exec(`DROP TABLE document_chunks;`);
    },
  },

  // Add more migrations here
];

// Main migration function
async function migrate(direction: "up" | "down", targetMigration?: string) {
  await initMigrationsTable();

  const appliedMigrations = await getAppliedMigrations();

  if (direction === "up") {
    // Run all migrations that haven't been applied yet
    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration.name)) {
        if (targetMigration && migration.name === targetMigration) {
          break;
        }
        console.log(`Applying migration: ${migration.name}`);

        try {
          await db.run("BEGIN TRANSACTION");

          await migration.up();
          db.query(`INSERT INTO migrations (name) VALUES ($1)`).get({
            $1: migration.name,
          });
          await db.run("COMMIT");

          console.log(`Successfully applied migration: ${migration.name}`);
        } catch (error) {
          await db.run("ROLLBACK");

          console.error(`Failed to apply migration ${migration.name}:`, error);
          process.exit(1);
        }
      }
    }
  } else {
    // Run down migrations in reverse order
    const reversedMigrations = [...migrations].reverse();
    for (const migration of reversedMigrations) {
      if (appliedMigrations.includes(migration.name)) {
        console.log(`Rolling back migration: ${migration.name}`);

        try {
          await db.run("BEGIN TRANSACTION");

          await migration.down();

          db.query(`DELETE FROM migrations WHERE name = $1`).get({
            $1: migration.name,
          });

          await db.run("COMMIT");

          console.log(`Successfully rolled back migration: ${migration.name}`);
        } catch (error) {
          console.error(
            `Failed to roll back migration ${migration.name}:`,
            error
          );
          await db.run("ROLLBACK");

          process.exit(1);
        }

        if (targetMigration && migration.name === targetMigration) {
          break;
        }
      }
    }
  }
}

// CLI interface
const direction = Bun.argv[2] as "up" | "down";
const targetMigration = Bun.argv[3];

if (!direction || !["up", "down"].includes(direction)) {
  console.error("Usage: bun run migrate.ts <up|down> [target-migration]");
  process.exit(1);
}

migrate(direction, targetMigration);
