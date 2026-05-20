import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  currentSeason: join(root, "app/src/features/gear/data/seasons/currentSeason.ts"),
  dungeonLoot: join(root, "app/src/features/gear/data/seasons/currentDungeonLoot.ts"),
  craftedGear: join(root, "app/src/features/gear/data/seasons/craftedGear.ts"),
  raidLoot: join(root, "app/src/features/gear/data/seasons/raidLoot.ts"),
  localization: join(root, "app/src/features/gear/domain/localization.ts"),
};

const read = (file) => readFileSync(file, "utf8");
const season = read(files.currentSeason);
const dungeonLoot = read(files.dungeonLoot);
const craftedGear = read(files.craftedGear);
const raidLoot = read(files.raidLoot);
const localization = read(files.localization);
const failures = [];
const warnings = [];

if (!season.includes('labelKo: "현재 시즌"')) failures.push("currentSeason must expose a Korean current season label.");
if (!season.includes("dungeonPool")) failures.push("currentSeason must define a dungeonPool.");
if (!localization.includes('DEFAULT_REGION = "kr"') || !localization.includes('DEFAULT_LOCALE = "ko_KR"')) {
  failures.push("Default region/locale must be kr/ko_KR.");
}

const itemIds = Array.from(`${dungeonLoot}\n${craftedGear}\n${raidLoot}`.matchAll(/itemId:\s*(\d+)/g)).map((match) => match[1]);
const duplicates = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
if (duplicates.length) failures.push(`Duplicate itemId values found: ${Array.from(new Set(duplicates)).join(", ")}`);

const dungeonBlocks = dungeonLoot.split(/itemId:/).slice(1);
dungeonBlocks.forEach((block, index) => {
  const label = `dungeon candidate #${index + 1}`;
  if (!block.includes("sourceType: \"dungeon\"")) failures.push(`${label} must use sourceType dungeon.`);
  if (!block.includes("seasonId: CURRENT_SEASON_ID")) failures.push(`${label} must set seasonId to CURRENT_SEASON_ID.`);
  if (!/sourceDungeonKey:\s*"[a-z0-9_-]+"/.test(block)) failures.push(`${label} must include sourceDungeonKey.`);
  if (!block.includes("isSeasonalReward: true") && !block.includes("confidence: \"low\"")) {
    failures.push(`${label} is not seasonal but is not marked low confidence.`);
  }
  if (!/nameKo:\s*"[^"]+"/.test(block)) warnings.push(`${label} has no Korean item name.`);
});

if (/sourceType:\s*"raid"/.test(craftedGear) || /sourceType:\s*"raid"/.test(dungeonLoot.replace(/confidence:\s*"low"/g, ""))) {
  failures.push("Raid candidates must not be present in default dungeon/craft data.");
}

if (/"Wowhead BIS"|Upgrade Candidate|Best in Slot|DPS 수치/.test(`${dungeonLoot}\n${craftedGear}\n${raidLoot}`)) {
  failures.push("User-facing gear data contains banned wording.");
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
if (failures.length) {
  failures.forEach((failure) => console.error(`Error: ${failure}`));
  process.exit(1);
}

console.log(`Gear season validation passed (${itemIds.length} candidates checked).`);
