import { z } from "zod";
import { generateEmbeddings } from "../../shared/generateEmbeddings";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import {
  searchDocuments,
  type SearchDocumentResponse,
} from "./searchDocuments";

const schema = z.object({
  text: z.string({ required_error: "search text is required" }),
});

export const searchRoute = async (request: Request) => {
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

  const result = await search({ text: data.text });

  return Response.json(result, { headers });
};

export type SearchResponse =
  | { results: SearchDocumentResponse[] }
  | { error: string };

export const search = async ({
  text,
}: {
  text: string;
}): Promise<SearchResponse> => {
  const embeddings = await generateEmbeddings(text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  if (!embeddings) {
    return { error: "Failed to generate embeddings" };
  }

  return { results: await searchDocuments({ embeddings }) };
};
