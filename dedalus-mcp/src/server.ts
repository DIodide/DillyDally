import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { getAllToolDefinitions, handleToolCall } from "./tools/index.js";

/**
 * Minimal MCP Server with add integers tool
 */
export class SimpleServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "dedalus-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: getAllToolDefinitions(),
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        return await handleToolCall(name, args);
      } catch (error) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          error instanceof Error ? error.message : `Unknown tool: ${name}`
        );
      }
    });
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => console.error("[MCP Error]", error);

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  getServer(): Server {
    return this.server;
  }
}
