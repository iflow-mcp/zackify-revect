import { z } from "zod";
import { generateEmbeddings } from "../../shared/generateEmbeddings";
import { indexDocument } from "./indexDocument";
import { indexDocumentChunk } from "./indexDocumentChunk";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import { splitTextIntoChunks } from "../../utils/splitTextIntoChunks";
import { db } from "../../database/database";

const schema = z.object({
  source: z.string(),
  external_id: z.string().optional(),
  text: z.string({ required_error: "Text field is required" }),
  metadata: z.record(z.any()).optional(),
});

export type IndexResult = { error: string } | { message: string };
export type IndexProps = z.infer<typeof schema>;
export const index = async (body: IndexProps): Promise<IndexResult> => {
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return {
      error: "Validation failed",
    };
  }

  //todo later get this from the user table or force ollama if running locally
  const embeddings = await generateEmbeddings(data.text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return { error: "Failed to generate embeddings" };
  }

  // Insert the main document and get its ID
  const documentId = await indexDocument({ ...data, embeddings });

  if (!documentId) {
    return { error: "Failed to index document" };
  }

  db.query("DELETE FROM document_chunks WHERE document_id = ?").run(documentId);

  // Check if the text needs to be chunked (longer than 200 characters)
  const chunks = splitTextIntoChunks(data.text);

  // First, generate embeddings for all chunks in parallel
  const chunkPromises = chunks.map(chunkText =>
    generateEmbeddings(chunkText, {
      apiKey: process.env.AI_API_KEY as string,
      baseURL: process.env.AI_BASE_URL,
    })
  );

  // Wait for all embedding generation to complete
  const chunkEmbeddings = await Promise.all(chunkPromises);

  // Then insert all chunks with their embeddings
  await Promise.all(
    chunks.map(async (chunk, i) => {
      const embeddings = chunkEmbeddings[i];
      if (embeddings) {
        await indexDocumentChunk({
          document_id: documentId,
          text: chunk,
          embeddings: embeddings,
        });
      }
    })
  );

  return { message: "Data successfully indexed" };
};

export const indexRoute = async (request: Request) => {
  const body = await request.json();
  const result = await index(body);

  if ("error" in result) {
    return Response.json(result, {
      status: 400,
      headers,
    });
  }

  return Response.json(result, { headers });
};
