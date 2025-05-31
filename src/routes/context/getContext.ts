import { z } from "zod";
import { corsHeaders as headers } from "../../shared/corsHeaders";
import { db } from "../../database/database";

const schema = z.object({
  key: z.string({ required_error: "Key field is required" }),
});

export type GetContextResult = { error: string } | { context: { key: string; message: string; metadata: Record<string, any> } };
export type GetContextProps = z.infer<typeof schema>;

export const getContext = async (body: GetContextProps): Promise<GetContextResult> => {
  const { error, data, success } = schema.safeParse(body);

  if (!success) {
    return {
      error: error.issues?.[0]?.message || "Validation failed",
    };
  }

  try {
    const context = db
      .query("SELECT text, metadata FROM documents WHERE external_id = ? AND source = 'context'")
      .get(data.key) as
      | { text: string; metadata: string }
      | undefined;

    if (!context) {
      return { error: "Context not found" };
    }

    return {
      context: {
        key: data.key,
        message: context.text,
        metadata: JSON.parse(context.metadata),
      },
    };
  } catch (e) {
    console.error("Error getting context:", e);
    return { error: "Failed to get context" };
  }
};

export const getContextRoute = async (request: Request) => {
  const body = await request.json();
  const result = await getContext(body);

  if ("error" in result) {
    return Response.json(result, {
      status: 400,
      headers,
    });
  }

  return Response.json(result, { headers });
};