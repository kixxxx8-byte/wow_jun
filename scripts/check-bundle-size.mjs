import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const htmlPath = path.join(process.cwd(), "dist", "v8", "index.html");
const assetsDir = path.join(process.cwd(), "dist", "v8", "assets");

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function initialAssets() {
  try {
    const html = readFileSync(htmlPath, "utf8");
    return new Set(
      Array.from(html.matchAll(/\/v8\/assets\/([^"']+\.(?:js|css))/g)).map((match) => match[1]),
    );
  } catch {
    return new Set();
  }
}

let entries;
try {
  const initial = initialAssets();
  entries = readdirSync(assetsDir)
    .filter((name) => /\.(js|css)$/.test(name))
    .map((name) => {
      const filePath = path.join(assetsDir, name);
      const raw = statSync(filePath).size;
      const gzip = gzipSync(readFileSync(filePath), { level: 9 }).length;
      return { name, raw, gzip, initial: initial.has(name) };
    })
    .sort((a, b) => b.raw - a.raw);
} catch {
  console.error("dist/v8/assets not found. Run npm run build first.");
  process.exit(1);
}

const total = entries.reduce(
  (sum, item) => ({ raw: sum.raw + item.raw, gzip: sum.gzip + item.gzip }),
  { raw: 0, gzip: 0 },
);
const initialTotal = entries
  .filter((item) => item.initial)
  .reduce((sum, item) => ({ raw: sum.raw + item.raw, gzip: sum.gzip + item.gzip }), { raw: 0, gzip: 0 });

console.log("Bundle size report");
console.log("==================");
for (const item of entries) {
  const phase = item.initial ? "initial" : "async  ";
  console.log(`${formatKb(item.raw).padStart(9)} raw  ${formatKb(item.gzip).padStart(9)} gzip  ${phase}  ${item.name}`);
}
console.log("------------------");
console.log(`${formatKb(initialTotal.raw).padStart(9)} raw  ${formatKb(initialTotal.gzip).padStart(9)} gzip  initial total`);
console.log(`${formatKb(total.raw).padStart(9)} raw  ${formatKb(total.gzip).padStart(9)} gzip  all js/css`);
