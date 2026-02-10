import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "db.sqlite");
console.log(`Creating database connection to ${dbPath}`);

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.exec("PRAGMA journal_mode = WAL;");

// Load sqlite-vec extension if available
try {
  const sqliteVec = require("sqlite-vec");
  sqliteVec.load(db);
  console.log("sqlite-vec extension loaded");
} catch (err) {
  console.warn("sqlite-vec extension not available, vector search may not work:", err.message);
}