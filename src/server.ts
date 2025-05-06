import { serve } from "bun";
import { indexRoute } from "./routes";

serve({
  routes: {
    "/index": (request) => indexRoute(request),
  },
  error(error) {
    console.error("Error processing request:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  },
});
