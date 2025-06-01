import express from "express";
import cors from "cors";
import { indexRoute, index } from "./routes/index/index";
import { searchRoute, search } from "./routes/search/search";
import { checkForApiKey } from "./shared/checkForApiKey";
import { document, documentRoute } from "./routes/document/document";
import { setContext, setContextRoute } from "./routes/context/setContext";
import { getContext, getContextRoute } from "./routes/context/getContext";
import { mcpRoute } from "./routes/mcp/mcp";
import { checkEmbeddingModel } from "./startup/checkEmbeddingModel";

// Initialize server

// Check if embedding model has changed on startup
console.log("Checking embedding model configuration...");
await checkEmbeddingModel();
console.log("Embedding model check completed");

// Create Express app
const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post("/index", checkForApiKey(indexRoute));
app.post("/search", checkForApiKey(searchRoute));
app.post("/document", checkForApiKey(documentRoute));
app.post("/set-context", checkForApiKey(setContextRoute));
app.post("/get-context", checkForApiKey(getContextRoute));
app.post("/mcp", mcpRoute({ methods: { search, document, index, setContext, getContext } }));

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error("Error processing request:", err);
  
  if (err.message?.includes("Unexpected end of JSON input")) {
    res.status(400).json({ error: "Must post data to this endpoint" });
    return;
  }
  
  res.status(500).json({ error: "Internal Server Error" });
});

// Start server
app.listen(port, () => {
  console.log(`revect.io now running on ${port}`);
});
