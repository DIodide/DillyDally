#!/usr/bin/env node

/**
 * Simple test script for the Dedalus MCP Server
 * Tests the add_integers tool functionality
 */

import { spawn } from "child_process";
import { Readable, Writable } from "stream";

interface McpRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
}

interface McpResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

let requestId = 1;

function createRequest(method: string, params?: unknown): McpRequest {
  return {
    jsonrpc: "2.0",
    id: requestId++,
    method,
    params,
  };
}

async function testMcpServer(): Promise<void> {
  console.log("🧪 Testing Dedalus MCP Server...\n");

  // Start the MCP server
  const serverProcess = spawn("node", ["dist/index.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  const serverInput = serverProcess.stdin!;
  const serverOutput = serverProcess.stdout!;
  const serverError = serverProcess.stderr!;

  // Collect responses
  let outputBuffer = "";
  const responses: McpResponse[] = [];

  serverOutput.on("data", (data: Buffer) => {
    outputBuffer += data.toString();
    const lines = outputBuffer.split("\n");
    outputBuffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line) as McpResponse;
          responses.push(response);
        } catch (e) {
          // Ignore non-JSON lines (like error messages)
        }
      }
    }
  });

  serverError.on("data", (data: Buffer) => {
    const message = data.toString();
    if (message.includes("MCP server running")) {
      console.log("✅ Server started successfully\n");
    }
  });

  // Wait for server to initialize
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test 1: Initialize
  console.log("📋 Test 1: Initialize server");
  const initRequest = createRequest("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0",
    },
  });
  serverInput.write(JSON.stringify(initRequest) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Test 2: List tools
  console.log("📋 Test 2: List available tools");
  const listToolsRequest = createRequest("tools/list");
  serverInput.write(JSON.stringify(listToolsRequest) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Test 3: Call add_integers tool
  console.log("📋 Test 3: Call add_integers tool (5 + 3)");
  const addIntegersRequest = createRequest("tools/call", {
    name: "add_integers",
    arguments: {
      a: 5,
      b: 3,
    },
  });
  serverInput.write(JSON.stringify(addIntegersRequest) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Test 4: Call add_integers with different numbers
  console.log("📋 Test 4: Call add_integers tool (10 + 20)");
  const addIntegersRequest2 = createRequest("tools/call", {
    name: "add_integers",
    arguments: {
      a: 10,
      b: 20,
    },
  });
  serverInput.write(JSON.stringify(addIntegersRequest2) + "\n");
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Wait for all responses
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Verify results
  console.log("\n📊 Test Results:\n");

  const listToolsResponse = responses.find(
    (r) => r.id === listToolsRequest.id
  );
  if (listToolsResponse?.result) {
    const tools = (listToolsResponse.result as { tools: unknown[] }).tools;
    console.log(`✅ Found ${tools.length} tool(s):`);
    tools.forEach((tool: unknown) => {
      const toolObj = tool as { name: string };
      console.log(`   - ${toolObj.name}`);
    });
  }

  const addIntegersResponse = responses.find(
    (r) => r.id === addIntegersRequest.id
  );
  if (addIntegersResponse?.result) {
    const content = (addIntegersResponse.result as { content: unknown[] })
      .content;
    const text = (content[0] as { text: string }).text;
    console.log(`\n✅ Test 3 Result: ${text}`);
    if (text === "Result: 8") {
      console.log("   ✅ Correct! 5 + 3 = 8");
    } else {
      console.log(`   ❌ Expected "Result: 8", got "${text}"`);
    }
  }

  const addIntegersResponse2 = responses.find(
    (r) => r.id === addIntegersRequest2.id
  );
  if (addIntegersResponse2?.result) {
    const content = (addIntegersResponse2.result as { content: unknown[] })
      .content;
    const text = (content[0] as { text: string }).text;
    console.log(`\n✅ Test 4 Result: ${text}`);
    if (text === "Result: 30") {
      console.log("   ✅ Correct! 10 + 20 = 30");
    } else {
      console.log(`   ❌ Expected "Result: 30", got "${text}"`);
    }
  }

  // Cleanup
  serverProcess.kill();
  console.log("\n✨ Tests completed!\n");
}

// Run tests
testMcpServer().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});

