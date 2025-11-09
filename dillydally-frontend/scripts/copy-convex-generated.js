import { cpSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible locations for the convex/_generated folder
// 1. Relative to frontend (monorepo structure: ../../convex/_generated)
// 2. Relative to monorepo root (if running from root: ./convex/_generated)
const possibleSources = [
  join(__dirname, "../../convex/_generated"),
  join(__dirname, "../../../convex/_generated"),
  join(process.cwd(), "convex/_generated"),
  join(process.cwd(), "../convex/_generated"),
];

const targetDir = join(__dirname, "../src/lib/convex-generated");

// Create target directory if it doesn't exist
if (!existsSync(targetDir)) {
  mkdirSync(targetDir, { recursive: true });
}

// Find the first existing source directory
let sourceDir = null;
for (const possibleSource of possibleSources) {
  if (existsSync(possibleSource)) {
    sourceDir = possibleSource;
    break;
  }
}

if (sourceDir) {
  cpSync(sourceDir, targetDir, { recursive: true });
  console.log(
    `✅ Copied convex/_generated from ${sourceDir} to frontend/src/lib/convex-generated`
  );
} else {
  console.error(
    "❌ Error: convex/_generated folder not found in any expected location."
  );
  console.error("   Searched in:", possibleSources);
  console.error("   Current working directory:", process.cwd());
  console.error(
    '   Make sure to run "npx convex dev" from the monorepo root first.'
  );
  process.exit(1);
}
