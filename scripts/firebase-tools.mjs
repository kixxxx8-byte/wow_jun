import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const firebaseBin = path.join(root, "node_modules", "firebase-tools", "lib", "bin", "firebase.js");
const portableNodeDir = path.join(root, ".tools", "node-v24.14.0-win-x64");

if (!existsSync(firebaseBin)) {
  console.error("firebase-tools is not installed. Run npm install first.");
  process.exit(1);
}

const pathValue = [portableNodeDir, process.env.PATH || process.env.Path || ""].filter(Boolean).join(path.delimiter);
const env = {
  ...process.env,
  PATH: pathValue,
  Path: pathValue,
};

const result = spawnSync(process.execPath, [firebaseBin, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
