# Dedalus MCP Server

A minimal Model Context Protocol (MCP) server implementation with a modular tool system.

## Features

- **Modular Tool System**: Tools are organized in separate files for easy extension
- **Add Integers Tool**: Adds two integers together (example tool)
- **STDIO Transport**: For local development
- **HTTP Transport**: For production/cloud deployment

## Installation

```bash
npm install
```

## Development

### STDIO Mode (Local Development)

```bash
npm run dev:stdio
```

### HTTP Mode

```bash
npm run dev:http
# or
PORT=3002 npm run dev:http
```

## Building

```bash
npm run build
```

## Testing

Run the test suite to verify the server works:

```bash
npm test
```

Or use the MCP Inspector for interactive testing:

```bash
npm run inspector
```

## Usage

The server provides a single tool by default:

### `add_integers`

Adds two integers together.

**Parameters:**

- `a` (number): First integer
- `b` (number): Second integer

**Example:**

```json
{
  "name": "add_integers",
  "arguments": {
    "a": 5,
    "b": 3
  }
}
```

**Response:**

```
Result: 8
```

## Adding New Tools

To add a new tool, follow these steps:

1. **Create a tool file** in `src/tools/` (e.g., `src/tools/myTool.ts`):

```typescript
import { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const myToolDefinition: Tool = {
  name: "my_tool",
  description: "Description of what the tool does",
  inputSchema: {
    type: "object",
    properties: {
      // Define your tool parameters
    },
    required: ["param1"],
  },
};

export async function handleMyTool(args: unknown): Promise<CallToolResult> {
  // Implement your tool logic
  return {
    content: [{ type: "text", text: "Tool result" }],
    isError: false,
  };
}
```

2. **Register the tool** in `src/tools/index.ts`:

```typescript
import { myToolDefinition, handleMyTool } from "./myTool.js";

// Add to the toolRegistry Map
toolRegistry.set("my_tool", {
  definition: myToolDefinition,
  handler: handleMyTool,
});
```

That's it! The tool will automatically be available through the MCP server.

## Project Structure

```
src/
├── index.ts          # Main entry point
├── server.ts         # MCP server implementation
├── cli.ts            # CLI argument parsing
├── test.ts           # Test suite
└── tools/            # Modular tool implementations
    ├── index.ts      # Tool registry
    └── addIntegers.ts # Example tool
└── transport/        # Transport implementations
    ├── stdio.ts      # STDIO transport
    └── http.ts       # HTTP transport
```

## License

MIT
