import { sql } from "bun";
import { db } from "./database";

export type IndexDocumentProps = {
  external_id?: string;
  text: string;
  source: string;
  embeddings: number[];
  metadata?: Record<string, any> | undefined;
};

export const indexDocument = async (
  data: IndexDocumentProps
): Promise<number | null> => {
  try {
    // Check if document with this external_id already exists
    if (data.external_id) {
      const existingDoc = db
        .query("SELECT id FROM documents WHERE external_id = $external_id")
        .get({ $external_id: data.external_id });

      if (existingDoc) {
        // Update existing document
        db.query(
          `
            UPDATE documents 
            SET 
              text = $2,
              metadata = $3,
              embeddings = $4,
              source = $5
            WHERE external_id = $1
          `
        ).run({
          $1: data.external_id,
          $2: data.text,
          $3: JSON.stringify(data.metadata || {}),
          $4: `[${data.embeddings.join(",")}]`,
          $5: data.source,
        });
        console.log(`Updated document with external_id ${data.external_id}`);
        return (existingDoc as any).id;
      }
    }

    // Insert new document if no existing document was found or no external_id provided
    const result = db
      .query(
        `
      INSERT INTO documents (external_id, text, metadata, embeddings, source)
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      RETURNING id
    `
      )
      .get({
        $1: data.external_id || null,
        $2: data.text,
        $3: JSON.stringify(data.metadata || {}),
        $4: `[${data.embeddings.join(",")}]`,
        $5: data.source,
      });

    const documentId = (result as any)?.id;

    console.log(`Inserted document ${data.external_id} with ID ${documentId}`);
    return documentId;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error with document ${data.external_id}:`, e.message);
    }
    return null;
  }
};
