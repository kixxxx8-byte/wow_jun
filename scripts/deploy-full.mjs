import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const firebaseTools = path.join(root, "scripts", "firebase-tools.mjs");
const preflight = path.join(root, "scripts", "preflight.mjs");
const project = "hokkaido-trip-c1907";

function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run([preflight]);
run([firebaseTools, "deploy", "--only", "functions,hosting", "--project", project]);
