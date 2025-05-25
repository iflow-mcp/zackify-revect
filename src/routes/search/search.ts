import { z } from "zod";
import { generateEmbeddings } from "../../shared/generateEmbeddings";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import { searchDocuments } from "./searchDocuments";

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

  const embeddings = await generateEmbeddings(data.text, {
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

  const results = await searchDocuments({ embeddings });

  return Response.json(
    {
      results,
    },
    { headers }
  );
};
