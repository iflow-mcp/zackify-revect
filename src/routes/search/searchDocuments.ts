import { db } from "../../database/database";

export type SearchDocumentsProps = {
  embeddings: number[];
};

export type SearchDocumentResponse = {
  id: number;
  text: string;
  distance: number;
  metadata: Record<string, any>;
  document_id: number;
};

export type DocumentChunkRow = {
  chunk_id: number;
  chunk_text: string;
  chunk_metadata: string;
  distance: number;
  document_id: number;
  document_metadata: string;
  document_source: string;
};

export const searchDocuments = async ({
  embeddings,
}: SearchDocumentsProps): Promise<SearchDocumentResponse[]> => {
  const rows = db
    .query(
      `
        SELECT 
          dc.id as chunk_id,
          dc.text as chunk_text,
          vec_distance_cosine(dc.embeddings, $1) as distance,
          d.id as document_id,
          d.source as document_source,
          d.metadata as document_metadata
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        ORDER BY distance
        LIMIT 10;
      `
    )
    .all({ $1: `[${embeddings.join(",")}]` }) as DocumentChunkRow[];

  return rows.map(row => ({
    id: row.chunk_id,
    text: row.chunk_text,
    source: row.document_source,
    distance: row.distance,
    metadata: JSON.parse(row.document_metadata as string),
    document_id: row.document_id,
  }));
};
