import type { Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { SearchResponse } from "../search/search";
import type { DocumentResponse } from "../document/document";
import type { IndexResult, IndexProps } from "../index";
import type { SetContextResult, SetContextProps } from "../context/setContext";
import type { GetContextResult, GetContextProps } from "../context/getContext";

// Create MCP server instance
const server = new McpServer({
  name: "revect",
  version: "1.0.0",
});

// Store active transports by session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

type Methods = {
  search: (props: { text: string }) => Promise<SearchResponse>;
  document: (props: { id: number }) => Promise<DocumentResponse>;
  index: (props: IndexProps) => Promise<IndexResult>;
  setContext: (props: SetContextProps) => Promise<SetContextResult>;
  getContext: (props: GetContextProps) => Promise<GetContextResult>;
};

function registerTools(methods: Methods) {
  // Search tool
  server.tool(
    "recall",
    "Search the user's revect database for past information",
    { text: z.string() },
    async ({ text }) => {
      try {
        const results = await methods.search({ text });
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

  // Get document by ID tool
  server.tool(
    "getDocumentById",
    "Get full document information by its ID from the revect database",
    { document_id: z.coerce.number() },
    async ({ document_id }) => {
      try {
        const result = await methods.document({ id: document_id });
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

  // Index/save content tool
  server.tool(
    "saveOrIndex",
    "Save content to the revect database",
    { text: z.string() },
    async ({ text }) => {
      try {
        const result = await methods.index({ text, source: "mcp" });
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

  // Set context tool
  server.tool(
    "setContext",
    "Store context information with a specific key for later retrieval",
    {
      key: z.string().describe("The key to store the context under"),
      message: z.string().describe("The context message to store"),
    },
    async ({ key, message }) => {
      try {
        const result = await methods.setContext({ key, message });
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

  // Get context tool
  server.tool(
    "getContext",
    "Retrieve context information by its key",
    { key: z.string().describe("The key to retrieve the context for") },
    async ({ key }) => {
      try {
        const result = await methods.getContext({ key });
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
}

let toolsRegistered = false;

export const mcpRoute = ({ methods }: { methods: Methods }) => {
  // Register tools once
  if (!toolsRegistered) {
    registerTools(methods);
    toolsRegistered = true;
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports.has(sessionId)) {
        // Reuse existing transport
        transport = transports.get(sessionId)!;
      } else if (!sessionId && req.method === "POST" && req.body?.method === "initialize") {
        // Create new transport for initialization
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
          onsessioninitialized: (sessionId) => {
            transports.set(sessionId, transport);
            console.log(`MCP session initialized: ${sessionId}`);
          }
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            transports.delete(transport.sessionId);
            console.log(`MCP session closed: ${transport.sessionId}`);
          }
        };

        await server.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Invalid request: missing session ID or not an initialize request' },
          id: null,
        });
        return;
      }

      // Handle the request using the MCP transport
      await transport.handleRequest(req as any, res as any, req.body);
      
    } catch (error) {
      console.error('MCP request error:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal server error' },
          id: null,
        });
      }
    }
  };
};