import { DuckDBInstance } from "@duckdb/node-api";

export const database = async () => {
  const newInstance = await DuckDBInstance.create("data.duckdb"); // Create a new instance
  const db = await newInstance.connect(); // Create a new connection

  // Run setup query on the new connection
  await db.run(`
    INSTALL vss;
    LOAD vss;

    CREATE TABLE IF NOT EXISTS metadata (
      embeddings_model VARCHAR,
    );
    
    INSERT INTO metadata (embeddings_model)
    SELECT '${process.env.AI_EMBEDDING_MODEL}'
    WHERE NOT EXISTS (SELECT 1 FROM metadata);

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      external_id VARCHAR UNIQUE,
      text VARCHAR,
      metadata JSON,

      embeddings FLOAT[${process.env.AI_EMBEDDING_SIZE}],

      source VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id INTEGER PRIMARY KEY,
      document_id INTEGER,
      FOREIGN KEY (document_id) REFERENCES documents(id),

      text VARCHAR,
      embeddings FLOAT[${process.env.AI_EMBEDDING_SIZE}],

      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    );
  `);

  return db;
};
