import { arrayValue, DuckDBConnection, DuckDBInstance } from "@duckdb/node-api"; // Revert to namespace import
import { initializeDb } from "./initializeDb";

type Props = {
  external_id?: string;
  text: string;
  embeddings: number[];
  metadata?: Record<string, any> | undefined;
};

export const indexToDb = async (data: Props) => {
  const { db } = await initializeDb();

  const result = await db.run(`SELECT COUNT(*) FROM documents`);
  // const result2 = await db.run(`SELECT * FROM documents`);
  // console.log(await result2.rowCount);
  const count = (await result.getRows())?.[0];
  if (!count) return;

  try {
    // Check if document with this external_id already exists
    if (data.external_id) {
      const existingDoc = await db.run(
        `SELECT id FROM documents WHERE external_id = $external_id`,
        { external_id: data.external_id }
      );
      const rows = await existingDoc.getRows();
      if (rows && rows.length > 0) {
        // Update existing document
        await db.run(
          `UPDATE documents SET text = $text, metadata = $metadata, embeddings = $embeddings, embeddings_model = $embeddings_model WHERE external_id = $external_id`,
          {
            external_id: data.external_id,
            text: data.text,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            embeddings: arrayValue(data.embeddings),
            embeddings_model: process.env.AI_EMBEDDING_MODEL as string,
          }
        );
        console.log(`Updated document with external_id ${data.external_id}`);
        return;
      }
    }

    // Insert new document if no existing document was found or no external_id provided
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
      console.error(`Error with document ${data.external_id}:`, e.message);
    }
  }
};
