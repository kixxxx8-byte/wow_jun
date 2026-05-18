import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const firebaseTools = path.join(root, "scripts", "firebase-tools.mjs");
const project = "hokkaido-trip-c1907";
const names = ["GEMINI_API_KEY", "BNET_CLIENT_ID", "BNET_CLIENT_SECRET"];

let failed = false;

for (const name of names) {
  const result = spawnSync(process.execPath, [firebaseTools, "functions:secrets:get", name, "--project", project], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
  });
  if (result.status === 0) {
    console.log(`OK ${name}`);
  } else {
    failed = true;
    console.log(`MISSING ${name}`);
  }
}

if (failed) process.exit(1);
