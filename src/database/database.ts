import * as sqliteVec from "sqlite-vec";
import Database from "bun:sqlite";

//macos needs custom path for extension loading
if (process.env.SQLITE_PATH) {
  Database.setCustomSQLite(process.env.SQLITE_PATH);
}

// Support test environments by allowing a database to be injected
// This is used by the test helpers to create isolated test databases
const testDb = (globalThis as any).testDb;

export const db = testDb || new Database(process.env.DATABASE_PATH || "./data/db.sqlite");

if (!testDb) {
  // Only configure the main db, test dbs are configured separately
  db.exec("PRAGMA journal_mode = WAL;");
  sqliteVec.load(db);
}
