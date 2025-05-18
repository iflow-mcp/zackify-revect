import { sql } from "bun";

export type SearchDocumentsProps = {
  embeddings: number[];
};

export type SearchDocumentResponse = {
  id: number;
  text: string;
  distance: number;
  metadata: Record<string, any>;
};

export type DocumentRow = {
  id: number;
  text: string;
  distance: number;
  metadata: string;
};

export const searchDocuments = async ({ embeddings }: SearchDocumentsProps) => {
  const rows = await sql.unsafe(
    `
      SELECT id, text, metadata, embeddings <-> $1 AS distance
      FROM documents
      ORDER BY embeddings <=> $1
      LIMIT 10;
    `,
    [`[${embeddings.join(",")}]`]
  );

  return rows.map((row: DocumentRow) => ({
    id: row.id,
    text: row.text,
    distance: row.distance,
    metadata: JSON.parse(row.metadata as string),
  }));
};
