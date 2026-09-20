import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Config from "../../configs.ts";

const DEFAULT_ASSETS: Array<[string, string]> = [
  ["MAAT-logo.svg", "portal/logo-light-default.svg"],
  ["MAAT-logo.svg", "portal/logo-dark-default.svg"],
  ["avatar-default.svg", "portal/avatar-light-default.svg"],
  ["avatar-default.svg", "portal/avatar-dark-default.svg"],
  ["login.png", "portal/login-light-default.png"],
  ["loginDark.png", "portal/login-dark-default.png"],
  ["favicon.svg", "portal/favicon-light-default.svg"],
  ["favicon.svg", "portal/favicon-dark-default.svg"],
];

export async function ensureDefaultAssets(): Promise<void> {
  const uploadRoot = path.resolve(Config.UPLOAD_DIR);
  const assetsRootCandidates = [
    // when running from src/ via node --watch src/server.ts : backend/assets
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../assets"),
    // when running compiled dist/server.js : dist/assets not present, fallback to backend/assets
    path.resolve(uploadRoot, "../assets"),
    // monorepo dev: frontend assets directly
    path.resolve(uploadRoot, "../../frontend/src/lib/assets"),
  ];

  let assetsRoot: string | null = null;
  for (const p of assetsRootCandidates) {
    try {
      await fs.promises.access(p);
      assetsRoot = p;
      break;
    } catch {
      // try next
    }
  }
  if (!assetsRoot) {
    console.warn("[assets] no assets source found, skipping default copy", assetsRootCandidates);
    return;
  }

  await fs.promises.mkdir(path.join(uploadRoot, "portal"), { recursive: true });

  for (const [srcName, destRel] of DEFAULT_ASSETS) {
    const src = path.join(assetsRoot, srcName);
    const dest = path.join(uploadRoot, destRel);
    try {
      await fs.promises.access(dest);
      continue; // already exists, do not overwrite user uploads
    } catch {
      // need to copy
    }
    try {
      await fs.promises.copyFile(src, dest);
      console.log(`[assets] copied default ${srcName} -> ${destRel}`);
    } catch (e) {
      console.warn("[assets] failed to copy", src, "->", dest, e);
    }
  }
}
