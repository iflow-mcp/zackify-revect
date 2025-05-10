import { DuckDBInstance } from "@duckdb/node-api";
import { currentMonthDb } from "./currentMonthDb";

export const initializeCurrentMonthDb = async () => {
  const { dbPath } = await currentMonthDb();

  const instance = await DuckDBInstance.create(dbPath);
  const db = await instance.connect();

  await db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      external_id VARCHAR UNIQUE,
      text VARCHAR,
      metadata JSON,

      embeddings FLOAT[${process.env.AI_EMBEDDING_SIZE}],
      embeddings_model VARCHAR
    )
  `);

  return { db };
};
