import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const midnightItemsPath = join(root, "app/src/features/gear/data/midnightS1Items.ts");
const currentSeasonPath = join(root, "app/src/features/gear/data/seasons/currentSeason.ts");

const midnightItems = readFileSync(midnightItemsPath, "utf8");
const currentSeason = readFileSync(currentSeasonPath, "utf8");

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
  for (let i = arrayStart; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") {
      depth += 1;
      if (depth === 1) objectStart = i;
    } else if (char === "}") {
      if (depth === 1 && objectStart >= 0) {
        blocks.push(source.slice(objectStart, i + 1));
        objectStart = -1;
      }
      depth -= 1;
    } else if (char === "]" && depth === 0) {
      break;
    }
  }
  return blocks;
}

function fieldValue(block, field) {
  return block.match(new RegExp(`${field}:\\s*"([^"]+)"`))?.[1];
}

function itemIdValue(block) {
  return Number(block.match(/itemId:\s*(\d+)/)?.[1] || 0);
}

function boolFieldValue(block, field) {
  const value = block.match(new RegExp(`${field}:\\s*(true|false)`))?.[1];
  return value ? value === "true" : undefined;
}

function arrayValues(block, field) {
  const content = block.match(new RegExp(`${field}:\\s*\\[([^\\]]+)\\]`, "s"))?.[1] || "";
  return Array.from(content.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
}

function countBy(values) {
  return values.reduce((counts, value) => {
    const key = value || "미지정";
    counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
}

function formatCounts(title, counts) {
  console.log(`\n${title}`);
  Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .forEach(([key, count]) => console.log(`  - ${key}: ${count}`));
}

const itemBlocks = extractArrayItemBlocks(midnightItems, "midnightS1Items");
const tierSetBlocks = extractArrayItemBlocks(midnightItems, "tierSetRecords");
const dungeonKeys = Array.from(currentSeason.matchAll(/key:\s*"([^"]+)"/g)).map((match) => match[1]);

const items = itemBlocks.map((block) => ({
  itemId: itemIdValue(block),
  nameKo: fieldValue(block, "nameKo") || "",
  nameKoVerified: boolFieldValue(block, "nameKoVerified"),
  slot: fieldValue(block, "slot") || "미지정",
  sourceType: fieldValue(block, "sourceType") || "미지정",
  sourceDungeonKey: fieldValue(block, "sourceDungeonKey") || "",
  sourceRaidKey: fieldValue(block, "sourceRaidKey") || "",
  recommendationState: fieldValue(block, "recommendationState") || "미지정",
  confidence: fieldValue(block, "confidence") || "미지정",
  allowedClasses: arrayValues(block, "allowedClasses"),
  allowedSpecs: arrayValues(block, "allowedSpecs"),
  setBonusKey: fieldValue(block, "setBonusKey") || "",
  isTierPiece: /isTierPiece:\s*true/.test(block),
  isCrafted: /isCrafted:\s*true/.test(block),
  hasMythicPlusVariants: /variants:\s*mythicPlusVariants\(\d+\)/.test(block),
  hasRaidVariants: /variants:\s*raidVariants\(\d+\)/.test(block),
  hasUniqueEquipGroup: /uniqueEquipGroup:\s*"[^"]+"/.test(block),
}));

const slots = [
  "HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "WRIST", "HANDS", "WAIST", "LEGS", "FEET",
  "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2", "MAIN_HAND", "OFF_HAND",
];
const sourceTypes = ["dungeon", "raid", "craft", "delve", "catalyst", "vendor"];
const classes = ["rogue", "demon-hunter"];
const MIN_DUNGEON_ITEMS_FOR_PROGRESS = 5;

console.log("Gear DB audit report");
console.log("====================");
console.log(`총 아이템: ${items.length}`);
console.log(`티어 세트: ${tierSetBlocks.length}`);
console.log(`쐐기 변형 보유: ${items.filter((item) => item.hasMythicPlusVariants).length}`);
console.log(`레이드 변형 보유: ${items.filter((item) => item.hasRaidVariants).length}`);
console.log(`한국어 공식명 검증 완료: ${items.filter((item) => item.nameKoVerified).length}`);
console.log(`확정 추천 상태: ${items.filter((item) => item.recommendationState === "recommended").length}`);
console.log(`확인 필요 상태: ${items.filter((item) => item.recommendationState === "needs_check").length}`);

formatCounts("출처별", countBy(items.map((item) => item.sourceType)));
formatCounts("부위별", countBy(items.map((item) => item.slot)));
formatCounts("신뢰도별", countBy(items.map((item) => item.confidence)));
formatCounts("추천 상태별", countBy(items.map((item) => item.recommendationState)));

console.log("\n던전별 쐐기 DB");
dungeonKeys.forEach((key) => {
  const dungeonItems = items.filter((item) => item.sourceDungeonKey === key);
  const slotSummary = Array.from(countBy(dungeonItems.map((item) => item.slot)).entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([slot, count]) => `${slot} ${count}`)
    .join(", ");
  console.log(`  - ${key}: ${dungeonItems.length}${slotSummary ? ` (${slotSummary})` : ""}`);
});

console.log("\n직업별 후보");
classes.forEach((classKey) => {
  const classItems = items.filter((item) => item.allowedClasses.includes(classKey));
  console.log(`  - ${classKey}: ${classItems.length}`);
});

const missingSlots = slots.filter((slot) => !items.some((item) => item.slot === slot));
const missingSources = sourceTypes.filter((sourceType) => !items.some((item) => item.sourceType === sourceType));
const dungeonsWithoutLoot = dungeonKeys.filter((key) => !items.some((item) => item.sourceDungeonKey === key));
const sparseDungeons = dungeonKeys
  .map((key) => ({ key, count: items.filter((item) => item.sourceDungeonKey === key).length }))
  .filter((row) => row.count < MIN_DUNGEON_ITEMS_FOR_PROGRESS)
  .sort((a, b) => a.count - b.count);
const sharedWithoutUniqueGroup = items.filter((item) => /^(FINGER|TRINKET)_/.test(item.slot) && !item.hasUniqueEquipGroup);
const raidWithoutVariants = items.filter((item) => item.sourceType === "raid" && !item.hasRaidVariants);
const dungeonWithoutVariants = items.filter((item) => item.sourceType === "dungeon" && !item.hasMythicPlusVariants);

console.log("\nDB 빈틈");
console.log(`  - 미등록 부위: ${missingSlots.length ? missingSlots.join(", ") : "없음"}`);
console.log(`  - 미등록 출처 타입: ${missingSources.length ? missingSources.join(", ") : "없음"}`);
console.log(`  - 아이템 없는 시즌 던전: ${dungeonsWithoutLoot.length ? dungeonsWithoutLoot.join(", ") : "없음"}`);
console.log(`  - ${MIN_DUNGEON_ITEMS_FOR_PROGRESS}개 미만 시즌 던전: ${sparseDungeons.length ? sparseDungeons.map((row) => `${row.key}(${row.count})`).join(", ") : "없음"}`);
console.log(`  - 고유 장착 그룹 없는 반지/장신구: ${sharedWithoutUniqueGroup.length}`);
console.log(`  - 레이드 변형 없는 레이드템: ${raidWithoutVariants.length}`);
console.log(`  - 쐐기 변형 없는 던전템: ${dungeonWithoutVariants.length}`);

const nextFocus = [];
if (missingSlots.length) nextFocus.push(`부위 미등록: ${missingSlots.join(", ")}`);
if (sparseDungeons.length) nextFocus.push(`던전 보강 우선: ${sparseDungeons.map((row) => `${row.key}(${row.count})`).join(", ")}`);
const unverifiedNames = items.filter((item) => !item.nameKoVerified).length;
if (unverifiedNames) nextFocus.push(`한국어 공식명 미검증: ${unverifiedNames}개`);

console.log("\n다음 보강 후보");
if (nextFocus.length) {
  nextFocus.forEach((line) => console.log(`  - ${line}`));
} else {
  console.log("  - 현재 감사 기준에서 즉시 보이는 빈틈은 없습니다.");
}
