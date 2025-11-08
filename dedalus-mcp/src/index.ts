#!/usr/bin/env node

import { parseArgs } from './cli.js';
import { SimpleServer } from './server.js';
import { runStdioTransport, startHttpTransport } from './transport/index.js';

/**
 * Main entry point for the Dedalus MCP Server
 */
async function main() {
    try {
        const cliOptions = parseArgs();
        const port = cliOptions.port || (process.env.PORT ? parseInt(process.env.PORT, 10) : undefined);
        const useHttp = !!port || !!process.env.PORT;

        if (useHttp && !cliOptions.stdio) {
            // HTTP transport for production/cloud deployment
            startHttpTransport({ port: port || 3002 });
        } else {
            // STDIO transport for local development
            const server = new SimpleServer();
            await runStdioTransport(server.getServer());
        }
    } catch (error) {
        console.error('Fatal error running Dedalus MCP server:', error);
        process.exit(1);
    }
}

// Run the server
main();
