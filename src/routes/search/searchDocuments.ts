import { db } from "../../database/database";

export type SearchDocumentsProps = {
  embeddings: number[];
  text: string;
};

export type SearchDocumentResponse = {
  id: number;
  text: string;
  source: string;
  distance: number;
  metadata: Record<string, any>;
  document_id: number;
};

export const searchDocuments = async ({
  embeddings,
  text,
}: SearchDocumentsProps): Promise<SearchDocumentResponse[]> => {
  // Simple text-based search using LIKE (fallback when vector search is not available)
  const rows = db
    .query(
      `
        SELECT 
          dc.id as chunk_id,
          dc.text as chunk_text,
          0 as distance,
          d.id as document_id,
          d.source as document_source,
          d.metadata as document_metadata
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.text LIKE '%' || $1 || '%'
        ORDER BY dc.id
        LIMIT 10;
      `
    )
    .all({ $1: text }) as any[];

  return rows.map(row => ({
    id: row.chunk_id,
    text: row.chunk_text,
    source: row.document_source,
    distance: row.distance,
    metadata: JSON.parse(row.document_metadata as string),
    document_id: row.document_id,
  }));
};