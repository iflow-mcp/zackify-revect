import { join } from "path";

/**
 * Ensures that the json file for the current month and year exists, creating it if necessary.
 */
export async function currentMonthDb() {
  const now = new Date();
  const year = now.getFullYear().toString();
  // Months are 0-indexed, so add 1. Pad with 0 if needed.
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const fileName = `${month}.db`;

  const yearPath = join("./data", year);
  const dbPath = join(yearPath, fileName);

  return { dbPath };
}
