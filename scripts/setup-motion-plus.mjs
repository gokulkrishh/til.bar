/**
 * Rewrites the motion-plus dependency URL in package.json to include the auth token
 * from MOTION_AUTH_TOKEN env var. Runs as a preinstall script.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const token = process.env.MOTION_AUTH_TOKEN;
if (!token) {
  console.warn("[setup-motion-plus] MOTION_AUTH_TOKEN not set, skipping");
  process.exit(0);
}

const pkgPath = resolve(import.meta.dirname, "../package.json");
const pkg = readFileSync(pkgPath, "utf-8");

const baseUrl =
  "https://api.motion.dev/registry.tgz?package=motion-plus&version=2.10.0";

if (!pkg.includes(baseUrl)) {
  process.exit(0);
}

// Only add token if not already present
if (pkg.includes(`${baseUrl}&token=`)) {
  process.exit(0);
}

const updated = pkg.replace(baseUrl, `${baseUrl}&token=${token}`);
writeFileSync(pkgPath, updated);
console.log("[setup-motion-plus] Auth token injected");
