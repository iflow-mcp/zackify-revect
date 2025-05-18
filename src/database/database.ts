import * as sqliteVec from "sqlite-vec";
import Database from "bun:sqlite";

//macos needs custom path for extension loading
if (process.env.SQLITE_PATH) {
  Database.setCustomSQLite(process.env.SQLITE_PATH);
}

export const db = new Database(process.env.DATABASE_PATH || ":memory:");
db.exec("PRAGMA journal_mode = WAL;");

sqliteVec.load(db);

const { vec_version } = db
  .prepare("select vec_version() as vec_version;")
  .get() as any;

console.log(`vss version: ${vec_version}`);
