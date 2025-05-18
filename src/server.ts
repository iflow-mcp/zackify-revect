import { serve, type BunRequest } from "bun";
import { indexRoute } from "./routes";
import App from "./frontend/public/app.html";
import { search } from "./routes/search";
import { checkForApiKey } from "./shared/checkForApiKey";

serve({
  routes: {
    "/index": checkForApiKey(indexRoute),
    "/search": checkForApiKey(search),
    //frontend
    "/app/*": App,
    "/app": App,
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
console.log("revect.io now running");
