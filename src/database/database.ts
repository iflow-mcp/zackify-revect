import * as sqliteVec from "sqlite-vec";
import Database from "bun:sqlite";

// macos needs custom path for extension loading
if (process.env.SQLITE_PATH) {
  Database.setCustomSQLite(process.env.SQLITE_PATH);
}

const dbPath = process.env.DATABASE_PATH || "./data/db.sqlite";
console.log(`Creating database connection to ${dbPath}`);

export const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
sqliteVec.load(db);
