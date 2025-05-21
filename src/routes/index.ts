import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { indexDocument } from "../database/indexDocument";
import { indexDocumentChunk } from "../database/indexDocumentChunk";
import { corsHeaders as headers } from "../shared/corsHeaders";
import { splitTextIntoChunks } from "../utils/splitTextIntoChunks";

const schema = z.object({
  source: z.string(),
  external_id: z.string().optional(),
  text: z.string({ required_error: "Text field is required" }),
  metadata: z.record(z.any()).optional(),
});

export const indexRoute = async (request: Request) => {
  const body = await request.json();
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return Response.json(
      {
        error: "Validation failed",
        issues: error.issues,
      },
      {
        status: 400,
        headers,
      }
    );
  }

  if (data?.metadata) {
    const metadataString = JSON.stringify(data.metadata);
    if (new TextEncoder().encode(metadataString).length > 100 * 1024) {
      return Response.json(
        { error: "Metadata exceeds 100KB limit" },
        {
          status: 413,
          headers,
        } // Payload Too Large
      );
    }
  }

  //todo later get this from the user table or force ollama if running locally
  const embeddings = await generate(data.text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return Response.json(
      { error: "Failed to generate embeddings" },
      {
        status: 500,
        headers,
      }
    );
  }

  // Insert the main document and get its ID
  const documentId = await indexDocument({ ...data, embeddings });

  if (!documentId) {
    return Response.json(
      { error: "Failed to index document" },
      {
        status: 500,
        headers,
      }
    );
  }

  // Check if the text needs to be chunked (longer than 200 characters)
  if (data.text.length > 200) {
    const chunks = splitTextIntoChunks(data.text);
    
    // First, generate embeddings for all chunks in parallel
    const chunkPromises = chunks.map(chunkText => 
      generate(chunkText, {
        apiKey: process.env.AI_API_KEY as string,
        baseURL: process.env.AI_BASE_URL,
      })
    );
    
    // Wait for all embedding generation to complete
    const chunkEmbeddings = await Promise.all(chunkPromises);
    
    // Then insert all chunks with their embeddings
    for (let i = 0; i < chunks.length; i++) {
      const embeddings = chunkEmbeddings[i];
      if (embeddings) {
        await indexDocumentChunk({
          document_id: documentId,
          text: chunks[i],
          embeddings: embeddings,
        });
      }
    }
  }

  return Response.json(
    {
      message: "Data received and validated",
      data,
    },
    { headers }
  );
};
