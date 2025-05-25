import { serve, type BunRequest } from "bun";
import { indexRoute } from "./routes/index/index";
import { search } from "./routes/search/search";
import { checkForApiKey } from "./shared/checkForApiKey";
import { document } from "./routes/document/document";

serve({
  routes: {
    "/index": checkForApiKey(indexRoute),
    "/search": checkForApiKey(search),
    "/document": checkForApiKey(document),
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
