import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "revect",
  version: "1.0.0",
});

// Search the index tool
server.tool(
  "recall",
  "Search the user's revect database for past information",
  { text: z.string() },
  async ({ text }) => {
    try {
      const response = await fetch(`${process.env.API_URL}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.API_SECRET as string,
        },
        body: JSON.stringify({ text }),
      });
      const { results } = (await response.json()) as { results: any[] };

      return {
        content: [
          {
            type: "text",
            text: `Here are the partial matches for ${text}. Please mention the 'document_id' and 'source' when telling the user about them.`,
          },
          ...(results
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
      const response = await fetch(`${process.env.API_URL}/document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.API_SECRET as string,
        },
        body: JSON.stringify({ id: document_id }),
      });
      const json = await response.json();
      console.log(json);
      const { document } = json as { document: any };

      return {
        content: [
          {
            type: "text",
            text: `Here is the full document information for ${document_id}.`,
          },
          {
            type: "text",
            text: `id:${document.id}, source:${
              document.source
            }, metadata:'${JSON.stringify(document.metadata)}', text: \n\n${
              document.text
            }`,
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
      //TODO make dynamic
      const response = await fetch(`${process.env.API_URL}/index`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.API_SECRET as string,
        },
        body: JSON.stringify({ text, source: "mcp" }),
      });
      const { message } = (await response.json()) as { message: string };

      return {
        content: [
          {
            type: "text",
            text: message,
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

import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use("/mcp", async (req, res) => {
  console.log("Handling mcp request");
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(process.env.PORT || 8001, () => {
  console.log(`Server is running on port ${process.env.PORT || 8001}`);
});
