import { db } from "../../database/database";

export type IndexDocumentChunkProps = {
  document_id: number;
  text: string;
  embeddings: number[];
};

/**
 * Inserts a document chunk into the document_chunks table
 * @param chunk The chunk data to insert
 * @returns boolean indicating success or failure
 */
export const indexDocumentChunk = async (
  chunk: IndexDocumentChunkProps
): Promise<boolean> => {
  try {
    db.query(
      `
      INSERT INTO document_chunks (document_id, text, embeddings)
      VALUES (
        $1,
        $2,
        $3
      )
    `
    ).run({
      $1: chunk.document_id,
      $2: chunk.text,
      $3: `[${chunk.embeddings.join(",")}]`,
    });

    return true;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`Error inserting document chunk:`, e.message);
    }
    return false;
  }
};
