export const searchDocumentsQuery = `
  SELECT id, text, metadata
  FROM documents
  ORDER BY array_cosine_distance(
    embeddings,
    ?::FLOAT[1024])
  LIMIT 10;
`;
