import type { BunRequest } from "bun";
import { corsHeaders } from "./corsHeaders";

export const checkForApiKey =
  (fn: (request: BunRequest) => Promise<Response>) => (request: BunRequest) => {
    if (request.method === "OPTIONS")
      return new Response(null, { headers: corsHeaders });

    if (request.headers.get("Authorization") !== process.env.API_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    return fn(request);
  };
