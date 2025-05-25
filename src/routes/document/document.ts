import { z } from "zod";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import { db } from "../../database/database";

type Document = {
  id: number;
  text: string;
  source: string;
  metadata: string;
};

export type DocumentResponse = { document: Document } | { error: string };
export const document = async ({
  id,
}: {
  id: number;
}): Promise<DocumentResponse> => {
  const document = db
    .query("SELECT id, source, metadata, text FROM documents WHERE id = ?")
    .get(id) as
    | { id: number; source: string; metadata: string; text: string }
    | undefined;

  if (!document) {
    return { error: "Document not found" };
  }

  return {
    document: {
      id: document.id,
      text: document.text,
      source: document.source,
      metadata: JSON.parse(document.metadata),
    },
  };
};

const getDocumentSchema = z.object({
  id: z.number({ required_error: "document id is required" }),
});

export const documentRoute = async (request: Request) => {
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

  const result = await document({ id: data.id });

  return Response.json(result, { headers });
};
