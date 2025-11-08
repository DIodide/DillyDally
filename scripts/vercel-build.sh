#!/bin/bash
set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Run the build
npm run build

# Debug output
echo "=== DEBUG: Current directory ==="
pwd

echo "=== DEBUG: Listing root ==="
ls -la | head -10

echo "=== DEBUG: Checking dillydally-frontend/dist ==="
ls -la dillydally-frontend/dist/ 2>&1 || echo "Directory not found"

echo "=== DEBUG: Full path to index.html ==="
find . -name 'index.html' -path '*/dist/*' 2>&1 | head -5

echo "=== DEBUG: Verifying outputDirectory ==="
if [ -d "dillydally-frontend/dist" ]; then
  echo "✓ dillydally-frontend/dist exists"
  echo "Contents:"
  ls -la dillydally-frontend/dist/
else
  echo "✗ dillydally-frontend/dist NOT FOUND"
fi

