import * as sqliteVec from "sqlite-vec";
import Database from "bun:sqlite";

// macos needs custom path for extension loading
if (process.env.SQLITE_PATH) {
  Database.setCustomSQLite(process.env.SQLITE_PATH);
}

/**
 * Get the database instance
 * This function always returns the current database, 
 * checking for a test database first, then falling back to the singleton
 */
export function getDb(): Database {
  // For tests, we support injecting a test database instance
  const testDb = (globalThis as any).testDb;
  if (testDb) {
    return testDb;
  }
  
  // For normal operation, create a singleton
  if (!(globalThis as any)._dbSingleton) {
    const dbPath = process.env.DATABASE_PATH || "./data/db.sqlite";
    console.log(`Creating database connection to ${dbPath}`);
    
    (globalThis as any)._dbSingleton = new Database(dbPath);
    (globalThis as any)._dbSingleton.exec("PRAGMA journal_mode = WAL;");
    sqliteVec.load((globalThis as any)._dbSingleton);
  }
  
  return (globalThis as any)._dbSingleton;
}

// Create and export a db proxy that always returns the current database instance
// This ensures that even code using the imported db directly will get the test db when appropriate
export const db = new Proxy({} as Database, {
  get: function(target, prop) {
    const currentDb = getDb();
    const value = currentDb[prop as keyof Database];
    
    // If it's a function, bind it to the correct database instance
    if (typeof value === 'function') {
      return value.bind(currentDb);
    }
    
    return value;
  }
});
