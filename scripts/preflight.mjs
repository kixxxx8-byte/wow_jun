import { spawnSync } from "node:child_process";

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error("npm_execpath is missing. Run this through npm.");
  process.exit(1);
}

function run(args) {
  const result = spawnSync(process.execPath, [npmExecPath, ...args], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["test"]);
run(["run", "build"]);
run(["--prefix", "functions", "run", "build"]);
