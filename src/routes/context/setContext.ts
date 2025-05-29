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
      error: "Validation failed",
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
    // Check if context with this key already exists
    const existingContext = db
      .query("SELECT id FROM documents WHERE external_id = ? AND source = 'context'")
      .get(data.key);

    if (existingContext) {
      // Update existing context
      db.query(
        `
          UPDATE documents 
          SET 
            text = ?,
            embeddings = ?,
            metadata = ?
          WHERE external_id = ? AND source = 'context'
        `
      ).run(
        data.message,
        `[${embeddings.join(",")}]`,
        JSON.stringify({ type: "context" }),
        data.key
      );
    } else {
      // Insert new context
      db.query(
        `
          INSERT INTO documents (external_id, text, embeddings, source, metadata)
          VALUES (?, ?, ?, 'context', ?)
        `
      ).run(
        data.key,
        data.message,
        `[${embeddings.join(",")}]`,
        JSON.stringify({ type: "context" })
      );
    }

    return { message: "Context successfully set" };
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