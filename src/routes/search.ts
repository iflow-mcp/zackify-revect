import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { corsHeaders as headers } from "../shared/corsHeaders";
import { sql } from "bun";

const schema = z.object({
  text: z.string({ required_error: "search text is required" }),
});

export const search = async (request: Request) => {
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

  const rows = await sql.unsafe(
    `
    SELECT id, text, metadata, embeddings <-> $1 AS distance
    FROM documents
    ORDER BY embeddings <=> $1
    LIMIT 10;
  `,
    [`[${embeddings.join(",")}]`]
  );

  return Response.json(
    {
      results: rows.map((row: any) => ({
        id: row.id,
        text: row.text,
        distance: row.distance,
        metadata: JSON.parse(row.metadata as string),
      })),
    },
    { headers }
  );
};
