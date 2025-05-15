import { z } from "zod";
import { generate } from "../embed-generation/generate";
import { corsHeaders as headers } from "../shared/corsHeaders";
import { dbConnection } from "../shared/dbConnection";
import { arrayValue } from "@duckdb/node-api";

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

  const { db } = await dbConnection();

  const search = await db.prepare(`
    SELECT id, text, metadata
    FROM documents
    ORDER BY array_cosine_distance(
      embeddings,
      $embeddings::FLOAT[1024])
    LIMIT 10;
  `);

  search.bind({ embeddings: arrayValue(embeddings) });
  const result = await search.run();
  const rows = await result.getRows();

  db.closeSync();

  return Response.json(
    {
      results: rows.map((row) => ({
        id: row[0],
        text: row[1],
        metadata: JSON.parse(row[2] as string),
      })),
    },
    { headers }
  );
};
