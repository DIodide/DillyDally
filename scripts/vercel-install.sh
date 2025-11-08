#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Remove all node_modules and package-lock.json files
rm -rf node_modules dillydally-frontend/node_modules dillydally-express/node_modules
rm -f package-lock.json dillydally-frontend/package-lock.json dillydally-express/package-lock.json

# Install dependencies with optional deps
npm install --include=optional

# Explicitly install Rollup Linux binary for frontend workspace
npm install --workspace=dillydally-frontend --include=optional @rollup/rollup-linux-x64-gnu

