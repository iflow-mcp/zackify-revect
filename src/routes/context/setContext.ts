import { z } from "zod";
import { generateEmbeddings } from "../../shared/generateEmbeddings";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import { db } from "../../database/database";

const schema = z.object({
  key: z.string({ required_error: "Key field is required" }),
  message: z.string({ required_error: "Message field is required" }),
});

export type SetContextResult = { error: string } | { message: string };
export type SetContextProps = z.infer<typeof schema>;

export const setContext = async (body: SetContextProps): Promise<SetContextResult> => {
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return {
      error: error.issues?.[0]?.message || "Validation failed",
    };
  }

  const embeddings = await generateEmbeddings(data.message, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return { error: "Failed to generate embeddings" };
  }

  try {
    // Use a transaction for atomic operation
    db.run("BEGIN TRANSACTION");
    
    try {
      // Use JSON.stringify for embeddings array (more efficient than join)
      const embeddingsStr = JSON.stringify(embeddings);
      const metadata = JSON.stringify({ type: "context" });
      
      // Use INSERT OR REPLACE for simpler logic
      db.query(
        `
          INSERT OR REPLACE INTO documents (external_id, text, embeddings, source, metadata)
          VALUES (?, ?, ?, 'context', ?)
        `
      ).run(
        data.key,
        data.message,
        embeddingsStr,
        metadata
      );
      
      db.run("COMMIT");
      return { message: "Context successfully set" };
    } catch (e) {
      db.run("ROLLBACK");
      throw e;
    }
  } catch (e) {
    console.error("Error setting context:", e);
    return { error: "Failed to set context" };
  }
};

export const setContextRoute = async (request: Request) => {
  const body = await request.json();
  const result = await setContext(body);

  if ("error" in result) {
    return Response.json(result, {
      status: 400,
      headers,
    });
  }

  return Response.json(result, { headers });
};