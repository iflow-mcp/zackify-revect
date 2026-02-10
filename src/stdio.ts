#!/usr/bin/env node
/**
 * stdio entry point for MCP protocol
 * Wraps the HTTP-based MCP server for stdio compatibility
 */

import { db } from "./database/database";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { index } from "./routes/index/index";
import { search } from "./routes/search/search";
import { document } from "./routes/document/document";
import { setContext } from "./routes/context/setContext";
import { getContext } from "./routes/context/getContext";

// Initialize database migrations (simplified version)
console.log("Initializing database...");
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const embeddingSize = process.env.AI_EMBEDDING_SIZE || "1024";

  // Create documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      external_id TEXT UNIQUE,
      text TEXT,
      metadata TEXT,
      embeddings FLOAT[${embeddingSize}],
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create document_chunks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER,
      text TEXT,
      embeddings FLOAT[${embeddingSize}],
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );
  `);

  // Create metadata table
  db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("Database initialized");
} catch (err) {
  console.error("Failed to initialize database:", err);
  process.exit(1);
}

// Create MCP server instance
const server = new McpServer({
  name: "revect",
  version: "1.0.0",
});

// Register tools
server.tool(
  "recall",
  "Search the user's revect database for past information",
  { text: z.string() },
  async ({ text }) => {
    try {
      const results = await search({ text });
      if ("error" in results) {
        return { content: [{ type: "text", text: results.error }] };
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Search results for "${text}". Please mention the 'document_id' and 'source' when referencing these.`,
          },
          ...results.results.map(result => ({
            type: "text" as const,
            text: `document_id:${result.document_id}, source:${result.source}, text:\n\n${result.text}`,
          })),
        ],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Search failed: ${(e as Error).message}` }],
      };
    }
  }
);

server.tool(
  "getDocumentById",
  "Get full document information by its ID from the revect database",
  { document_id: z.coerce.number() },
  async ({ document_id }) => {
    try {
      const result = await document({ id: document_id });
      if ("error" in result) {
        return { content: [{ type: "text", text: result.error }] };
      }

      return {
        content: [{
          type: "text",
          text: `Document ${document_id}:\nSource: ${result.document.source}\nMetadata: ${JSON.stringify(result.document.metadata)}\n\n${result.document.text}`,
        }],
      };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Failed to get document: ${(e as Error).message}` }],
      };
    }
  }
);

server.tool(
  "saveOrIndex",
  "Save content to the revect database",
  { text: z.string() },
  async ({ text }) => {
    try {
      const result = await index({ text, source: "mcp" });
      if ("error" in result) {
        return { content: [{ type: "text", text: result.error }] };
      }
      return { content: [{ type: "text", text: result.message }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Failed to index: ${(e as Error).message}` }],
      };
    }
  }
);

server.tool(
  "setContext",
  "Store context information with a specific key for later retrieval",
  {
    key: z.string().describe("The key to store the context under"),
    message: z.string().describe("The context message to store"),
  },
  async ({ key, message }) => {
    try {
      const result = await setContext({ key, message });
      if ("error" in result) {
        return { content: [{ type: "text", text: result.error }] };
      }
      return { content: [{ type: "text", text: result.message }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Failed to set context: ${(e as Error).message}` }],
      };
    }
  }
);

server.tool(
  "getContext",
  "Retrieve context information by its key",
  { key: z.string().describe("The key to retrieve the context for") },
  async ({ key }) => {
    try {
      const result = await getContext({ key });
      if ("error" in result) {
        return { content: [{ type: "text", text: result.error }] };
      }
      return { content: [{ type: "text", text: result.context.message }] };
    } catch (e) {
      return {
        content: [{ type: "text", text: `Failed to get context: ${(e as Error).message}` }],
      };
    }
  }
);

// Start stdio server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);