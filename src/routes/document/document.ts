import { z } from "zod";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import { db } from "../../database/database";

const getDocumentSchema = z.object({
  id: z.number({ required_error: "document id is required" }),
});

export const document = async (request: Request) => {
  const body = await request.json();
  const { error, data, success } = getDocumentSchema.safeParse(body);

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

  const document = db
    .query("SELECT id, source, metadata, text FROM documents WHERE id = ?")
    .get(data.id) as
    | { id: number; source: string; metadata: string; text: string }
    | undefined;

  if (!document) {
    return Response.json(
      { error: "Document not found" },
      {
        status: 404,
        headers,
      }
    );
  }

  return Response.json(
    {
      document: {
        id: document.id,
        text: document.text,
        source: document.source,
        metadata: JSON.parse(document.metadata),
      },
    },
    { headers }
  );
};
