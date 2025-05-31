import { db } from "./database";

/**
 * Checks if the metadata table exists
 * @returns true if metadata table exists, false otherwise
 */
export const metadataTableExists = (): boolean => {
  try {
    const result = db
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'")
      .get();
    return !!result;
  } catch (error) {
    return false;
  }
};

/**
 * Gets a metadata value from the database
 * @param key The metadata key to retrieve
 * @returns The value as string or null if not found
 */
export const getMetadataValue = (key: string): string | null => {
  try {
    // Return null if metadata table doesn't exist (brand new database)
    if (!metadataTableExists()) {
      return null;
    }

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
    // If metadata table doesn't exist, we can't set metadata yet
    // This will be handled after migrations run
    if (!metadataTableExists()) {
      console.warn(`Cannot set metadata for key ${key}: metadata table does not exist yet`);
      return false;
    }

    // Check if the key already exists
    const exists = db.query("SELECT 1 FROM metadata WHERE key = ?").get(key);

    if (exists) {
      // Update existing record
      db.query(
        "UPDATE metadata SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?"
      ).run(value, key);
    } else {
      // Insert new record
      db.query("INSERT INTO metadata (key, value) VALUES (?, ?)").run(
        key,
        value
      );
    }

    return true;
  } catch (error) {
    console.error(`Error setting metadata for key ${key}:`, error);
    return false;
  }
};
