import { serve } from "bun";
import { indexRoute } from "./routes";
import App from "./frontend/public/app.html";

serve({
  routes: {
    "/index": (request) => indexRoute(request),
    "/app/*": App,
    "/app": App,
    "/db/:year/:month": (request) => {
      return new Response(
        Bun.file(`./data/${request.params.year}/${request.params.month}.db`)
      );
    },
    "/db/:year/:month/wal": (request) => {
      return new Response(
        Bun.file(`./data/${request.params.year}/${request.params.month}.db.wal`)
      );
    },
  },
  error(error) {
    console.error("Error processing request:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  },
});
