import { Tool, CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  addIntegersToolDefinition,
  handleAddIntegers,
} from "./addIntegers.js";

/**
 * Tool registry entry interface
 */
export interface ToolRegistryEntry {
  definition: Tool;
  handler: (args: unknown) => Promise<CallToolResult>;
}

/**
 * Registry of all available tools
 */
export const toolRegistry: Map<string, ToolRegistryEntry> = new Map([
  [
    "add_integers",
    {
      definition: addIntegersToolDefinition,
      handler: handleAddIntegers,
    },
  ],
]);

/**
 * Get all tool definitions for listing
 * @returns {Tool[]} Array of tool definitions
 */
export function getAllToolDefinitions(): Tool[] {
  return Array.from(toolRegistry.values()).map((entry) => entry.definition);
}

/**
 * Handle a tool call by name
 * @param {string} name - Tool name
 * @param {unknown} args - Tool arguments
 * @returns {Promise<CallToolResult>} Tool call result
 */
export async function handleToolCall(
  name: string,
  args: unknown
): Promise<CallToolResult> {
  const tool = toolRegistry.get(name);
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(args);
}

