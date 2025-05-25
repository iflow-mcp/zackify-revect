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
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Get list of applied migrations
async function getAppliedMigrations(): Promise<string[]> {
  const result = db.query(`SELECT name FROM migrations ORDER BY id ASC`).all();
  return result.map((row: any) => row.name);
}

// Example migrations array
export const migrations: Migration[] = [
  {
    name: "create_documents_table",
    up: () => {
      return db.exec(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          external_id TEXT UNIQUE,
          text TEXT,
          metadata TEXT,
          embeddings FLOAT[1024],
          source TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER,
          text TEXT,
          embeddings FLOAT[1024],
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
          db.query(`INSERT INTO migrations (name) VALUES ($1)`).run({
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

          db.query(`DELETE FROM migrations WHERE name = $1`).run({
            $1: migration.name,
          });

          await db.run("COMMIT");

          console.log(`Successfully rolled back migration: ${migration.name}`);
        } catch (error) {
          await db.run("ROLLBACK");

          console.error(
            `Failed to roll back migration ${migration.name}:`,
            error
          );
          process.exit(1);
        }
      }
    }
  }
}
// Run migrations when script is executed directly
if (import.meta.main) {
  const args = process.argv.slice(2);
  const direction = args[0]?.toLowerCase();

  if (direction !== "up" && direction !== "down") {
    console.error("Usage: bun run migrations.ts [up|down]");
    process.exit(1);
  }

  console.log(`Running migrations: ${direction}`);
  migrate(direction)
    .then(() => {
      console.log("Migration complete");
      process.exit(0);
    })
    .catch(error => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
