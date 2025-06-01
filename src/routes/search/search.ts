import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateEmbeddings } from "../../shared/generateEmbeddings";
import {
  searchDocuments,
  type SearchDocumentResponse,
} from "./searchDocuments";

const schema = z.object({
  text: z.string({ required_error: "search text is required" }),
});

export const searchRoute = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    res.status(400).json({
      error: "Validation failed",
      issues: error.issues,
    });
    return;
  }

  const result = await search({ text: data.text });

  res.json(result);
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
