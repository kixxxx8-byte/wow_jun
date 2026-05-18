import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

await mkdir(dist, { recursive: true });
await Promise.all([
  rm(resolve(dist, "v8-ai"), { recursive: true, force: true }),
  rm(resolve(dist, "data"), { recursive: true, force: true }),
]);
await writeFile(
  resolve(dist, "index.html"),
  `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WJ+ Command</title>
  <meta http-equiv="refresh" content="0; url=/v8/" />
  <script>location.replace("/v8/" + location.search + location.hash);</script>
</head>
<body>
  <a href="/v8/">WJ+ Command로 이동</a>
</body>
</html>
`,
);

console.log("Wrote root redirect to dist/index.html.");
