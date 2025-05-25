import * as sqliteVec from "sqlite-vec";
import Database from "bun:sqlite";

//macos needs custom path for extension loading
if (process.env.SQLITE_PATH) {
  Database.setCustomSQLite(process.env.SQLITE_PATH);
}

export const db = new Database(process.env.DATABASE_PATH || "./data/db.sqlite");
db.exec("PRAGMA journal_mode = WAL;");

sqliteVec.load(db);
