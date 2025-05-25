import { serve } from "bun";
import { indexRoute, index } from "./routes/index/index";
import { searchRoute, search } from "./routes/search/search";
import { checkForApiKey } from "./shared/checkForApiKey";
import { document, documentRoute } from "./routes/document/document";
import { mcpRoute } from "./routes/mcp/mcp";
import { checkEmbeddingModel } from "./startup/checkEmbeddingModel";

// Check if embedding model has changed on startup
(async () => {
  try {
    await checkEmbeddingModel();
  } catch (error) {
    console.error("Error checking embedding model:", error);
  }
})();

serve({
  port: process.env.PORT || 3000,
  idleTimeout: 255, // 5 minutes - MCP connections may have long periods of inactivity
  routes: {
    "/index": checkForApiKey(indexRoute),
    "/search": checkForApiKey(searchRoute),
    "/document": checkForApiKey(documentRoute),
    "/mcp": mcpRoute({ methods: { search, document, index } }),
  },
  error(error) {
    console.error("Error processing request:", error);

    if (error.message.includes("Unexpected end of JSON input"))
      return Response.json(
        { error: "Must post data to this endpoint" },
        { status: 400 }
      );
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  },
});
console.log(`revect.io now running on ${process.env.PORT || 3000}`);
