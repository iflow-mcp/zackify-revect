import { z } from "zod";
import { generate } from "../embed-generation/generate";

const schema = z.object({
  text: z.string({ required_error: "Text field is required" }),
  metadata: z.record(z.any()).optional(),
});

export const indexRoute = async (request: Request) => {
  const body = await request.json();
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return Response.json(
      {
        error: "Validation failed",
        issues: error.issues,
      },
      { status: 400 }
    );
  }

  if (data?.metadata) {
    const metadataString = JSON.stringify(data.metadata);
    if (new TextEncoder().encode(metadataString).length > 100 * 1024) {
      return Response.json(
        { error: "Metadata exceeds 100KB limit" },
        { status: 413 } // Payload Too Large
      );
    }
  }

  //todo later get this from the user table or force ollama if running locally
  const embeddings = await generate(data.text, {
    apiKey: process.env.AI_API_KEY as string,
    baseURL: process.env.AI_BASE_URL,
  });

  return Response.json({
    message: "Data received and validated",
    data,
    embeddings,
  });
};
