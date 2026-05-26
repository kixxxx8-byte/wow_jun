import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const files = {
  currentSeason: join(root, "app/src/features/gear/data/seasons/currentSeason.ts"),
  dungeonLoot: join(root, "app/src/features/gear/data/seasons/currentDungeonLoot.ts"),
  craftedGear: join(root, "app/src/features/gear/data/seasons/craftedGear.ts"),
  raidLoot: join(root, "app/src/features/gear/data/seasons/raidLoot.ts"),
  midnightItems: join(root, "app/src/features/gear/data/midnightS1Items.ts"),
  localization: join(root, "app/src/features/gear/domain/localization.ts"),
};

const read = (file) => readFileSync(file, "utf8");
const season = read(files.currentSeason);
const dungeonLoot = read(files.dungeonLoot);
const craftedGear = read(files.craftedGear);
const raidLoot = read(files.raidLoot);
const midnightItems = read(files.midnightItems);
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

const midnightData = midnightItems.split("export const midnightS1Items")[1] || "";
const midnightBlocks = midnightData.split(/itemId:/).slice(1);
midnightBlocks.forEach((block, index) => {
  const label = `midnight S1 item #${index + 1}`;
  const idMatch = block.match(/^\s*(\d+)/);
  if (!idMatch || idMatch[1] === "0") failures.push(`${label} must not use placeholder itemId 0.`);
  if (!/nameKo:\s*"[^"]+"/.test(block)) failures.push(`${label} must include nameKo.`);
  if (!/slot:\s*"[A-Z0-9_]+"/.test(block)) failures.push(`${label} must include a slot.`);
  if (!/sourceType:\s*"(dungeon|raid|craft|delve|catalyst|vendor|unknown)"/.test(block)) failures.push(`${label} must include a valid sourceType.`);
  if (!/sourceNameKo:\s*"[^"]+"/.test(block)) failures.push(`${label} must include sourceNameKo.`);
  if (!/season:\s*"midnight-s1"/.test(block)) failures.push(`${label} must be tagged as midnight-s1.`);
  if (!/confidence:\s*"(high|medium|low)"/.test(block)) failures.push(`${label} must include confidence.`);
  if (!/recommendationState:\s*"(recommended|needs_check|hidden|rejected|db_missing)"/.test(block)) failures.push(`${label} must include recommendationState.`);
  if (/slot:\s*"TRINKET_[12]"/.test(block)) {
    if (!/trinketTier:\s*[^,\n]+/.test(block)) failures.push(`${label} trinket must include trinketTier.`);
    if (!/tier:\s*"(S|A|B|C|주의)"/.test(block)) failures.push(`${label} trinket tier must include tier.`);
    if (!/contentFocus:\s*"(mythic_plus|raid|balanced)"/.test(block)) failures.push(`${label} trinket tier must include contentFocus.`);
    if (!/needsSim:\s*(true|false)/.test(block)) failures.push(`${label} trinket tier must include needsSim.`);
    if (!/sources:\s*\[/.test(block)) failures.push(`${label} trinket tier must include sources.`);
  }
});

if (/"예시|Example/.test(midnightItems)) failures.push("Midnight S1 item DB must not expose example placeholder data.");

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
if (failures.length) {
  failures.forEach((failure) => console.error(`Error: ${failure}`));
  process.exit(1);
}

console.log(`Gear season validation passed (${itemIds.length} candidates checked).`);
