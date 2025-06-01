import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
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

export const documentRoute = async (req: Request, res: Response, next: NextFunction) => {
  const body = req.body;
  const { error, data, success } = getDocumentSchema.safeParse(body);

  if (!success) {
    res.status(400).json({
      error: "Validation failed",
      issues: error.issues,
    });
    return;
  }

  const result = await document({ id: data.id });

  res.json(result);
};
