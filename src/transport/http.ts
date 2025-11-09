import { createServer, IncomingMessage, ServerResponse } from "http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";
import { SimpleServer } from "../server.js";

/** Session storage for streamable HTTP connections */
const sessions = new Map<
  string,
  { transport: StreamableHTTPServerTransport; server: any }
>();

interface HttpConfig {
  port: number;
}

/**
 * Starts the HTTP transport server
 * @param {HttpConfig} config - Server configuration
 */
export function startHttpTransport(config: HttpConfig): void {
  const httpServer = createServer();

  httpServer.on("request", async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    switch (url.pathname) {
      case "/mcp":
        await handleMcpRequest(req, res);
        break;
      case "/health":
        handleHealthCheck(res);
        break;
      default:
        handleNotFound(res);
    }
  });

  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

  httpServer.listen(config.port, host, () => {
    console.log(
      `Dedalus MCP Server listening on http://${host}:${config.port}`
    );
  });
}

/**
 * Handles MCP protocol requests
 * @param {IncomingMessage} req - HTTP request
 * @param {ServerResponse} res - HTTP response
 * @returns {Promise<void>}
 * @private
 */
async function handleMcpRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      res.statusCode = 404;
      res.end("Session not found");
      return;
    }
    return await session.transport.handleRequest(req, res);
  }

  if (req.method === "POST") {
    await createNewSession(req, res);
    return;
  }

  res.statusCode = 400;
  res.end("Invalid request");
}

/**
 * Creates a new MCP session for HTTP transport
 * @param {IncomingMessage} req - HTTP request
 * @param {ServerResponse} res - HTTP response
 * @returns {Promise<void>}
 * @private
 */
async function createNewSession(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const serverInstance = new SimpleServer().getServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId: string) => {
      sessions.set(sessionId, { transport, server: serverInstance });
      console.log("New Dedalus MCP session created:", sessionId);
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
      console.log("Dedalus MCP session closed:", transport.sessionId);
    }
  };

  try {
    await serverInstance.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("Streamable HTTP connection error:", error);
    res.statusCode = 500;
    res.end("Internal server error");
  }
}

/**
 * Handles health check endpoint
 * @param {ServerResponse} res - HTTP response
 * @private
 */
function handleHealthCheck(res: ServerResponse): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Handles 404 Not Found responses
 * @param {ServerResponse} res - HTTP response
 * @private
 */
function handleNotFound(res: ServerResponse): void {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}
