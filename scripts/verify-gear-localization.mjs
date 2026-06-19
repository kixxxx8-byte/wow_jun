import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dataPath = join(root, "app/src/features/gear/data/midnightS1Items.ts");
const endpoint = process.env.GEAR_ITEM_TOOLTIP_ENDPOINT || "https://hokkaido-trip-c1907.web.app/api/items/tooltip";
const shouldWrite = process.argv.includes("--write");
const verifiedAt = new Date().toISOString().slice(0, 10);
const concurrency = 4;

function extractArrayItemBlocks(source, exportName) {
  const marker = `export const ${exportName}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return [];
  const assignmentIndex = source.indexOf("=", markerIndex);
  const arrayStart = assignmentIndex >= 0 ? source.indexOf("[", assignmentIndex) : -1;
  if (arrayStart < 0) return [];

  const blocks = [];
  let depth = 0;
  let objectStart = -1;
  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
      if (depth === 1) objectStart = index;
    } else if (char === "}") {
      if (depth === 1 && objectStart >= 0) {
        blocks.push({ start: objectStart, end: index + 1, text: source.slice(objectStart, index + 1) });
        objectStart = -1;
      }
      depth -= 1;
    } else if (char === "]" && depth === 0) {
      break;
    }
  }
  return blocks;
}

function stringField(block, field) {
  return block.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1] || "";
}

function escapeTypeScriptString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function fetchItemName(itemId, attempt = 1) {
  const url = new URL(endpoint);
  url.searchParams.set("itemId", String(itemId));
  url.searchParams.set("region", "kr");
  url.searchParams.set("locale", "ko_KR");

  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    if (attempt < 3 && (response.status === 429 || response.status >= 500)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
      return fetchItemName(itemId, attempt + 1);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name || new RegExp(`^Item\\s+${itemId}$`, "i").test(name)) {
    throw new Error("Battle.net ko_KR 이름이 비어 있습니다.");
  }
  return name;
}

function applyVerification(block, officialName, eol) {
  const escapedName = escapeTypeScriptString(officialName);
  let next = block.replace(/nameKo:\s*"[^"]*"/, `nameKo: "${escapedName}"`);
  next = next.replace(/nameKoVerified:\s*(true|false)/, "nameKoVerified: true");

  if (/nameKoVerifiedAt:\s*"[^"]*"/.test(next)) {
    next = next.replace(/nameKoVerifiedAt:\s*"[^"]*"/, `nameKoVerifiedAt: "${verifiedAt}"`);
  } else {
    next = next.replace("nameKoVerified: true,", `nameKoVerified: true,${eol}    nameKoVerifiedAt: "${verifiedAt}",`);
  }

  if (/nameKoSource:\s*"[^"]*"/.test(next)) {
    next = next.replace(/nameKoSource:\s*"[^"]*"/, 'nameKoSource: "blizzard"');
  } else {
    next = next.replace(`nameKoVerifiedAt: "${verifiedAt}",`, `nameKoVerifiedAt: "${verifiedAt}",${eol}    nameKoSource: "blizzard",`);
  }
  return next;
}

const source = await readFile(dataPath, "utf8");
const eol = source.includes("\r\n") ? "\r\n" : "\n";
const blocks = extractArrayItemBlocks(source, "midnightS1Items");
if (!blocks.length) throw new Error("midnightS1Items 배열을 찾지 못했습니다.");

const items = blocks.map((block) => ({
  ...block,
  itemId: Number(block.text.match(/itemId:\s*(\d+)/)?.[1] || 0),
  currentName: stringField(block.text, "nameKo"),
}));
const invalidIds = items.filter((item) => !Number.isInteger(item.itemId) || item.itemId <= 0);
if (invalidIds.length) throw new Error(`유효하지 않은 itemId 블록이 ${invalidIds.length}개 있습니다.`);

const results = [];
for (let index = 0; index < items.length; index += concurrency) {
  const batch = items.slice(index, index + concurrency);
  const batchResults = await Promise.all(batch.map(async (item) => {
    try {
      const officialName = await fetchItemName(item.itemId);
      return { ...item, officialName, error: "" };
    } catch (error) {
      return { ...item, officialName: "", error: error instanceof Error ? error.message : String(error) };
    }
  }));
  results.push(...batchResults);
}

const failures = results.filter((result) => result.error);
const renamed = results.filter((result) => result.officialName && result.officialName !== result.currentName);
console.log(`Battle.net ko_KR 검증: ${results.length - failures.length}/${results.length}`);
console.log(`공식 이름과 다른 항목: ${renamed.length}`);
renamed.forEach((result) => console.log(`  - ${result.itemId}: ${result.currentName} -> ${result.officialName}`));
failures.forEach((result) => console.error(`  - 실패 ${result.itemId}: ${result.error}`));

if (failures.length) {
  console.error("일부 항목 검증에 실패해 파일을 변경하지 않았습니다.");
  process.exit(1);
}

if (shouldWrite) {
  let updated = source;
  results
    .slice()
    .sort((left, right) => right.start - left.start)
    .forEach((result) => {
      const replacement = applyVerification(result.text, result.officialName, eol);
      updated = `${updated.slice(0, result.start)}${replacement}${updated.slice(result.end)}`;
    });
  await writeFile(dataPath, updated, "utf8");
  console.log(`공식 한국어 이름과 검증 메타데이터를 ${dataPath}에 반영했습니다.`);
} else {
  console.log("파일 반영은 npm run gear:verify-ko:write 명령으로 실행합니다.");
}
