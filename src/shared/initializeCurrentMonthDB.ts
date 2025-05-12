import { DuckDBInstance, DuckDBConnection } from "@duckdb/node-api";
import { currentMonthDb } from "./currentMonthDb";

// Cache only the connection and the month it was created for
let cachedDb: DuckDBConnection | null = null;
let cachedMonth: number | null = null;

export const initializeCurrentMonthDb = async () => {
  const currentMonth = new Date().getMonth();

  if (cachedMonth === currentMonth && cachedDb) {
    //console.log("Using cached DB connection for month:", currentMonth);
    return { db: cachedDb };
  }

  console.log(
    `Initializing new DB connection for month: ${currentMonth}. Previous cache month: ${cachedMonth}`
  );

  cachedDb?.closeSync();
  const { dbPath } = await currentMonthDb();

  const newInstance = await DuckDBInstance.create(dbPath); // Create a new instance
  const newDb = await newInstance.connect(); // Create a new connection

  // Update cache
  cachedDb = newDb;
  cachedMonth = currentMonth;

  // Run setup query on the new connection
  await cachedDb.run(`
    LOAD vss;
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      external_id VARCHAR UNIQUE,
      text VARCHAR,
      metadata JSON,

      embeddings FLOAT[${process.env.AI_EMBEDDING_SIZE}],
      embeddings_model VARCHAR
    )
  `);

  return { db: cachedDb };
};
