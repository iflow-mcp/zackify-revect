import { db } from "./database";

export type SearchDocumentsProps = {
  embeddings: number[];
};

export type SearchDocumentResponse = {
  id: number;
  text: string;
  distance: number;
  source: string;
  metadata: Record<string, any>;
};

export type DocumentRow = {
  id: number;
  text: string;
  source: string;
  distance: number;
  metadata: string;
};

export const searchDocuments = async ({
  embeddings,
}: SearchDocumentsProps): Promise<SearchDocumentResponse[]> => {
  const rows = db
    .query(
      `
        SELECT id, text, metadata, source, vec_distance_cosine(embeddings, $1) as distance
        FROM documents
        ORDER BY distance
        LIMIT 10;
      `
    )
    .all({ $1: `[${embeddings.join(",")}]` }) as DocumentRow[];

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    source: row.source,
    distance: row.distance,
    metadata: JSON.parse(row.metadata as string),
  }));
};
