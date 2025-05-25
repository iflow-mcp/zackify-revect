import { db } from "./database";

/**
 * Gets a metadata value from the database
 * @param key The metadata key to retrieve
 * @returns The value as string or null if not found
 */
export const getMetadataValue = (key: string): string | null => {
  try {
    // Ensure the metadata table exists before querying it
    ensureMetadataTable();
    
    const result = db
      .query("SELECT value FROM metadata WHERE key = ?")
      .get(key);
    
    return result ? (result as any).value : null;
  } catch (error) {
    console.error(`Error getting metadata for key ${key}:`, error);
    return null;
  }
};

/**
 * Sets a metadata value in the database
 * @param key The metadata key to set
 * @param value The value to store
 * @returns true if successful, false otherwise
 */
export const setMetadataValue = (key: string, value: string): boolean => {
  try {
    // Ensure the metadata table exists before writing to it
    ensureMetadataTable();
    
    // Check if the key already exists
    const exists = db.query("SELECT 1 FROM metadata WHERE key = ?").get(key);
    
    if (exists) {
      // Update existing record
      db.query(
        "UPDATE metadata SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?"
      ).run(value, key);
    } else {
      // Insert new record
      db.query(
        "INSERT INTO metadata (key, value) VALUES (?, ?)"
      ).run(key, value);
    }
    
    return true;
  } catch (error) {
    console.error(`Error setting metadata for key ${key}:`, error);
    return false;
  }
};

/**
 * Ensures the metadata table exists before using it
 * This is important if the application is accessing the metadata
 * before migrations have been run (e.g. during early startup)
 */
function ensureMetadataTable() {
  try {
    // Check if metadata table exists
    const tableExists = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'"
    ).get();
    
    if (!tableExists) {
      // Create table if it doesn't exist yet
      db.exec(`
        CREATE TABLE IF NOT EXISTS metadata (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("Created metadata table since it didn't exist yet");
    }
  } catch (error) {
    console.error("Error ensuring metadata table exists:", error);
  }
}