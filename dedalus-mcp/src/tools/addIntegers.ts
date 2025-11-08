import { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Tool definition for adding integers
 */
export const addIntegersToolDefinition: Tool = {
  name: "add_integers",
  description: "Adds two integers together",
  inputSchema: {
    type: "object",
    properties: {
      a: {
        type: "number",
        description: "First integer",
      },
      b: {
        type: "number",
        description: "Second integer",
      },
    },
    required: ["a", "b"],
  },
};

/**
 * Handles the add_integers tool call
 * @param {unknown} args - Tool call arguments
 * @returns {Promise<CallToolResult>} Tool call result
 */
export async function handleAddIntegers(
  args: unknown
): Promise<CallToolResult> {
  if (!args || typeof args !== "object") {
    return {
      content: [
        {
          type: "text",
          text: "Error: Arguments must be an object",
        },
      ],
      isError: true,
    };
  }

  const { a, b } = args as { a?: unknown; b?: unknown };

  if (typeof a !== "number" || typeof b !== "number") {
    return {
      content: [
        {
          type: "text",
          text: "Error: Both a and b must be numbers",
        },
      ],
      isError: true,
    };
  }

  const result = a + b;

  return {
    content: [
      {
        type: "text",
        text: `Result: ${result}`,
      },
    ],
    isError: false,
  };
}
