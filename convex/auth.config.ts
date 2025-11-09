// Get environment variable - works in both Node.js (Express/Convex) and Vite (browser)
// This file is used by both Express (Node.js) and Vite frontend, so we need to support both environments
function getEnvVar(name: string, viteName?: string): string | undefined {
  // Check for Vite/browser environment first (import.meta.env)
  // We use a function to safely check for import.meta without causing parse errors in Convex
  const checkViteEnv = () => {
    try {
      // Use Function constructor to avoid parse-time errors in environments that don't support import.meta
      const getImportMeta = new Function(
        'try { return typeof import.meta !== "undefined" ? import.meta : null; } catch { return null; }'
      );
      const importMeta = getImportMeta() as { env?: Record<string, string> } | null;
      if (importMeta?.env) {
        const viteVarName = viteName || `VITE_${name}`;
        return importMeta.env[viteVarName];
      }
    } catch {
      // import.meta not supported (e.g., in Convex runtime)
    }
    return undefined;
  };

  const viteValue = checkViteEnv();
  if (viteValue !== undefined) {
    return viteValue;
  }

  // Node.js/Convex environment - use process.env
  // Access process via globalThis to avoid TypeScript errors in browser builds
  try {
    const globalObj = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : {};
    const nodeProcess = (globalObj as any).process;
    if (nodeProcess?.env) {
      return nodeProcess.env[name];
    }
  } catch {
    // process not available
  }
  return undefined;
}

export default {
  providers: [
    {
      domain: getEnvVar("CONVEX_SITE_URL"),
      applicationID: "convex",
    },
  ],
};
