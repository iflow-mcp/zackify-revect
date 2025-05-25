import * as sqliteVec from "sqlite-vec";
import Database from "bun:sqlite";

// macos needs custom path for extension loading
if (process.env.SQLITE_PATH) {
  Database.setCustomSQLite(process.env.SQLITE_PATH);
}

// Create a singleton database object per test
let _db: Database | null = null;

// Get the database instance - creates a new one if it doesn't exist
export function getDb(): Database {
  // For tests, we support injecting a test database instance
  const testDb = (globalThis as any).testDb;
  if (testDb) {
    return testDb;
  }
  
  // For normal operation, use the singleton pattern
  if (!_db) {
    _db = new Database(process.env.DATABASE_PATH || "./data/db.sqlite");
    _db.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load(_db);
  }
  
  return _db;
}

// Provide a backward-compatible db export for existing code
export const db = getDb();
