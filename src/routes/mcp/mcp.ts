import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { BunRequestAdapter, BunResponseAdapter } from "./mcpToBun";
import type { SearchDocumentResponse } from "../search/searchDocuments";
import type { SearchResponse } from "../search/search";
import type { DocumentResponse } from "../document/document";
import type { IndexResult } from "../index";
import type { IndexProps } from "../index";
import type { SetContextResult, SetContextProps } from "../context/setContext";
import type { GetContextResult, GetContextProps } from "../context/getContext";

// Create an MCP server
const server = new McpServer({
  name: "revect",
  version: "1.0.0",
});

// Store transports by session ID (supports both StreamableHTTP and SSE)
const transports: Record<string, StreamableHTTPServerTransport | SSEServerTransport> = {};

// Helper function to check if request is an initialize request
function isInitializeRequest(body: any): boolean {
  try {
    return body && body.method === "initialize";
  } catch {
    return false;
  }
}

type Methods = {
  search: (props: { text: string }) => Promise<SearchResponse>;
  document: (props: { id: number }) => Promise<DocumentResponse>;
  index: (props: IndexProps) => Promise<IndexResult>;
  setContext: (props: SetContextProps) => Promise<SetContextResult>;
  getContext: (props: GetContextProps) => Promise<GetContextResult>;
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
              text: `Failed to set context: ${(e as Error).message}`,
            },
          ],
        };
      }
    }
  );

  // Get context tool
  server.tool(
    "getContext",
    "Retrieve context information by its key",
    {
      key: z.string().describe("The key to retrieve the context for"),
    },
    async ({ key }) => {
      try {
        const result = await methods.getContext({ key });

        if ("error" in result) {
          return {
            content: [{ type: "text", text: result.error }],
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `${result.context.message}`,
            },
          ],
        };
      } catch (e) {
        console.error(e);
        return {
          content: [
            {
              type: "text",
              text: `Failed to get context: ${(e as Error).message}`,
            },
          ],
        };
      }
    }
  );
};

// Track if tools have been registered
let toolsRegistered = false;

// have to do all this weird crap because MCP sdk decided to use express req / res
// instead of the modern request / response type.... hope to remove a lot of this if they move off it
export const mcpRoute = ({ methods }: { methods: Methods }) => {
  // Register tools only once
  if (!toolsRegistered) {
    tools(server, methods);
    toolsRegistered = true;
  }

  return async (request: Request) => {
    console.log(`Received ${request.method} request to /mcp`);

    return new Promise<Response>(async (resolve) => {
      try {
        // Check for existing session ID
        const sessionId = request.headers.get('mcp-session-id');
        let transport: StreamableHTTPServerTransport;

        // Parse body for POST requests
        let bodyText: string | undefined;
        let parsedBody: any;
        if (request.method === "POST") {
          try {
            bodyText = await request.text();
            parsedBody = JSON.parse(bodyText);
          } catch (e) {
            bodyText = undefined;
          }
        }

        if (sessionId && transports[sessionId]) {
          // Check if the transport is of the correct type
          const existingTransport = transports[sessionId];
          if (existingTransport instanceof StreamableHTTPServerTransport) {
            // Reuse existing transport
            transport = existingTransport;
            console.log(`Reusing existing transport for session ${sessionId}`);
          } else {
            // Transport exists but is not a StreamableHTTPServerTransport (could be SSEServerTransport)
            const errorResponse = new Response(
              JSON.stringify({
                jsonrpc: '2.0',
                error: {
                  code: -32000,
                  message: 'Bad Request: Session exists but uses a different transport protocol',
                },
                id: null,
              }),
              {
                status: 400,
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            resolve(errorResponse);
            return;
          }
        } else if (!sessionId && request.method === "POST" && isInitializeRequest(parsedBody)) {
          // Create new transport for initialization request
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => crypto.randomUUID(),
            onsessioninitialized: (sessionId) => {
              // Store the transport by session ID when session is initialized
              console.log(`StreamableHTTP session initialized with ID: ${sessionId}`);
              transports[sessionId] = transport;
            }
          });

          // Set up onclose handler to clean up transport when closed
          transport.onclose = () => {
            const sid = transport.sessionId;
            if (sid && transports[sid]) {
              console.log(`Transport closed for session ${sid}, removing from transports map`);
              delete transports[sid];
            }
          };

          // Connect the transport to the MCP server
          await server.connect(transport);
        } else {
          // Invalid request - no session ID or not initialization request
          const errorResponse = new Response(
            JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32000,
                message: 'Bad Request: No valid session ID provided',
              },
              id: null,
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          resolve(errorResponse);
          return;
        }

        // Create adapters - pass the body text to the request adapter
        const reqAdapter = new BunRequestAdapter(request, bodyText);
        const resAdapter = new BunResponseAdapter(resolve);

        console.log('Handling request with transport, sessionId:', transport.sessionId);
        
        // Handle the request - pass parsedBody as third parameter
        await transport.handleRequest(reqAdapter as any, resAdapter as any, parsedBody);
        
        console.log('Request handled');
      } catch (error) {
        console.error('Error handling MCP request:', error);
        const errorResponse = new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        resolve(errorResponse);
      }
    });
  };
};

//=============================================================================
// DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
//=============================================================================

// Helper to find SSE transport by checking request headers or other criteria
function findSSETransport(): SSEServerTransport | undefined {
  // Find the first SSE transport in our transports map
  for (const [id, transport] of Object.entries(transports)) {
    if (transport instanceof SSEServerTransport) {
      return transport;
    }
  }
  return undefined;
}

export const sseRoute = ({ methods }: { methods: Methods }) => {
  // Register tools only once
  if (!toolsRegistered) {
    tools(server, methods);
    toolsRegistered = true;
  }

  return async (request: Request) => {
    console.log('Received GET request to /sse (deprecated SSE transport)');
    
    return new Promise<Response>((resolve) => {
      // Create a custom response adapter for SSE
      let transport: SSEServerTransport;
      
      const sseResponseAdapter = {
        writeHead: (statusCode: number, headers: Record<string, string>) => {
          console.log('SSE writeHead called with:', statusCode, headers);
        },
        write: (chunk: string) => {
          // This will be overridden once we have the controller
          return true;
        },
        end: () => {
          console.log('SSE end called');
        },
        on: (event: string, handler: Function) => {
          if (event === 'close') {
            // Handle close event
            console.log('SSE close event registered');
          }
        }
      };
      
      // Create ReadableStream that will handle the SSE data
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Create SSE transport - using relative path without leading slash
            transport = new SSEServerTransport('messages', sseResponseAdapter as any);
            
            // Override the write method to send data through the stream
            sseResponseAdapter.write = (chunk: string) => {
              controller.enqueue(new TextEncoder().encode(chunk));
              return true;
            };
            
            // Store transport by session ID
            transports[transport.sessionId] = transport;
            console.log(`SSE session initialized with ID: ${transport.sessionId}`);
            
            // Connect the transport to the MCP server
            await server.connect(transport);
            
            // The transport should handle the rest
          } catch (error) {
            console.error('Error setting up SSE transport:', error);
            controller.error(error);
          }
        },
        cancel() {
          // Clean up transport when client disconnects
          if (transport && transport.sessionId && transports[transport.sessionId]) {
            console.log(`SSE connection closed for session ${transport.sessionId}, removing from transports map`);
            delete transports[transport.sessionId];
          }
        }
      });

      // Return SSE response with proper headers
      const response = new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
      });
      
      resolve(response);
    });
  };
};

// SSE Messages endpoint handler
export const sseMessagesRoute = () => {
  return async (request: Request) => {
    console.log('Received POST request to /messages (SSE transport)');
    
    try {
      // Find the SSE transport
      const transport = findSSETransport();
      if (!transport) {
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32001,
              message: 'No SSE transport found',
            },
            id: null,
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Parse the request body
      const body = await request.json();
      console.log('SSE message received:', body);
      
      // Handle the message through the transport
      if (transport.onmessage) {
        transport.onmessage(body);
      }

      // Return empty response
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error('Error handling SSE message:', error);
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
};
