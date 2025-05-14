import { DuckDBInstance, DuckDBConnection } from "@duckdb/node-api";

export const initializeDb = async () => {
  const newInstance = await DuckDBInstance.create("data.duckdb"); // Create a new instance
  const db = await newInstance.connect(); // Create a new connection

  // Run setup query on the new connection
  await db.run(`
    INSTALL vss;
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

  return { db };
};
