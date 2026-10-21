import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const srcRoot = fileURLToPath(new URL("../src/", import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const base = srcRoot + specifier.slice(2);
    for (const suffix of [".ts", ".tsx", ".mjs", ".js"]) {
      const candidate = base + suffix;
      if (existsSync(candidate)) return nextResolve(pathToFileURL(candidate).href, context);
    }
  }
  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    const base = fileURLToPath(new URL(specifier, context.parentURL));
    for (const suffix of [".ts", ".tsx"]) {
      if (existsSync(base + suffix)) return nextResolve(pathToFileURL(base + suffix).href, context);
    }
  }
  return nextResolve(specifier, context);
}
