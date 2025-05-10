import { arrayValue, DuckDBConnection, DuckDBInstance } from "@duckdb/node-api"; // Revert to namespace import
import { initializeCurrentMonthDb } from "./initializeCurrentMonthDB";

type Props = {
  external_id?: string;
  text: string;
  embeddings: number[];
  metadata?: Record<string, any> | undefined;
};

export const indexToDb = async (data: Props) => {
  const { db } = await initializeCurrentMonthDb();

  const result = await db.run(`SELECT COUNT(*) FROM documents`);
  // const result2 = await db.run(`SELECT * FROM documents`);
  // console.log(await result2.rowCount);
  const count = (await result.getRows())?.[0];
  if (!count) return;
  try {
    const result = await db.run(
      `INSERT INTO documents (id, external_id, text, metadata, embeddings, embeddings_model) VALUES ($id, $external_id, $text, $metadata, $embeddings, $embeddings_model)`,
      {
        id: parseInt(count as unknown as string) + 1,
        external_id: data.external_id || null,
        text: data.text,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        embeddings: arrayValue(data.embeddings),
        embeddings_model: process.env.AI_EMBEDDING_MODEL as string,
      }
    );
    console.log(`Inserted ${result.rowsChanged} document ${data.external_id}`);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.includes("violates unique constraint")) {
        console.log(`Document already exists for ${data.external_id}`);
      } else {
        console.error(e);
      }
    }
  }
};
