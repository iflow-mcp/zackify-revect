import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { BunRequestAdapter, BunResponseAdapter } from "./mcpToBun";
import type { SearchDocumentResponse } from "../search/searchDocuments";
import type { SearchResponse } from "../search/search";
import type { DocumentResponse } from "../document/document";
import type { IndexResult } from "../index";
import type { IndexProps } from "../index";

// Create an MCP server
const server = new McpServer({
  name: "revect",
  version: "1.0.0",
});

type Methods = {
  search: (props: { text: string }) => Promise<SearchResponse>;
  document: (props: { id: number }) => Promise<DocumentResponse>;
  index: (props: IndexProps) => Promise<IndexResult>;
};
const tools = (server: McpServer, methods: Methods) => {
  // Search the index tool
  server.tool(
    "recall",
    "Search the user's revect database for past information",
    { text: z.string() },
    async ({ text }) => {
      try {
        const results = await methods.search({ text });

        if ("error" in results) {
          return {
            content: [{ type: "text", text: results.error }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Here are the partial matches for ${text}. Please mention the 'document_id' and 'source' when telling the user about them.`,
            },
            ...(results.results
              .map((result: any) => [
                {
                  type: "text",
                  text: `document_id:${result.document_id}, source:${result.source}, text: \n\n${result.text}`,
                },
              ])
              .flatMap(x => x) as { type: "text"; text: string }[]),
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to search: ${(e as Error).message}`,
            },
          ],
        };
      }
    }
  );

  // full document data tool

  server.tool(
    "getDocumentById",
    "Get full document information by its id, from our saved revect database",
    { document_id: z.coerce.number() },
    async ({ document_id }) => {
      try {
        const result = await methods.document({ id: document_id });

        if ("error" in result) {
          return {
            content: [{ type: "text", text: result.error }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Here is the full document information for ${document_id}.`,
            },
            {
              type: "text",
              text: `id:${result.document.id}, source:${
                result.document.source
              }, metadata:'${JSON.stringify(
                result.document.metadata
              )}', text: \n\n${result.document.text}`,
            },
          ],
        };
      } catch (e) {
        return {
          content: [
            {
              type: "text",
              text: `Failed to search: ${(e as Error).message}`,
            },
          ],
        };
      }
    }
  );
  // index more content
  server.tool(
    "saveOrIndex",
    "Save the user's request to revect",
    { text: z.string() },
    async ({ text }) => {
      try {
        const result = await methods.index({ text, source: "mcp" });

        if ("error" in result) {
          return {
            content: [{ type: "text", text: result.error }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: result.message,
            },
          ],
        };
      } catch (e) {
        console.error(e);
        return {
          content: [
            {
              type: "text",
              text: `Failed to index: ${(e as Error).message}`,
            },
          ],
        };
      }
    }
  );
};

// have to do all this weird crap because MCP sdk decided to use express req / res
// instead of the modern request / response type.... hope to remove a lot of this if they move off it
export const mcpRoute = ({ methods }: { methods: Methods }) => {
  tools(server, methods);

  return async (request: Request) => {
    return new Promise(async resolve => {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);

      // Parse body for POST requests
      let bodyText: string | undefined;
      if (request.method === "POST") {
        try {
          bodyText = await request.text();
        } catch (e) {
          bodyText = undefined;
        }
      }
      console.log("New MCP request", bodyText);

      // Create adapters - pass the body text to the request adapter
      const reqAdapter = new BunRequestAdapter(request, bodyText);
      const resAdapter = new BunResponseAdapter(resolve);

      // Handle the request - don't pass parsedBody separately
      await transport.handleRequest(reqAdapter as any, resAdapter as any);
    }) as unknown as Response;
  };
};
