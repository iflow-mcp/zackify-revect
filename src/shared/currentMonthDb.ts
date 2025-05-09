import { join } from "path";

/**
 * Ensures that the json file for the current month and year exists, creating it if necessary.
 * The path is determined by process.env.STORAGE_PATH, the current year, and the current month.
 */
export async function currentMonthDb() {
  const storagePath = process.env.STORAGE_PATH;
  if (!storagePath) {
    throw new Error("STORAGE_PATH environment variable is not set.");
  }

  const now = new Date();
  const year = now.getFullYear().toString();
  // Months are 0-indexed, so add 1. Pad with 0 if needed.
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const fileName = `${month}.db`;

  const yearPath = join(storagePath, year);
  const dbPath = join(yearPath, fileName);

  return { dbPath };
}
