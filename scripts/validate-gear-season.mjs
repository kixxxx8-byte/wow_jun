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

function boolFieldValue(block, field) {
  const value = block.match(new RegExp(`${field}:\\s*(true|false)`))?.[1];
  return value ? value === "true" : undefined;
}

if (!season.includes('labelKo: "현재 시즌"')) failures.push("currentSeason must expose a Korean current season label.");
if (!season.includes("dungeonPool")) failures.push("currentSeason must define a dungeonPool.");
if (!localization.includes('DEFAULT_REGION = "kr"') || !localization.includes('DEFAULT_LOCALE = "ko_KR"')) {
  failures.push("Default region/locale must be kr/ko_KR.");
}

const itemIds = Array.from(`${dungeonLoot}\n${craftedGear}\n${raidLoot}`.matchAll(/itemId:\s*(\d+)/g)).map((match) => match[1]);
const duplicates = itemIds.filter((id, index) => itemIds.indexOf(id) !== index);
if (duplicates.length) failures.push(`Duplicate itemId values found: ${Array.from(new Set(duplicates)).join(", ")}`);
const seasonDungeonKeys = new Set(Array.from(season.matchAll(/key:\s*"([^"]+)"/g)).map((match) => match[1]));

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

function validateSharedSlotUniqueGroups(blocks, labelPrefix) {
  blocks.forEach((block, index) => {
    const label = `${labelPrefix} #${index + 1}`;
    if (/slot:\s*"(FINGER_[12]|TRINKET_[12])"/.test(block) && !/uniqueEquipGroup:\s*"[^"]+"/.test(block)) {
      failures.push(`${label} shared ring/trinket candidate must include uniqueEquipGroup.`);
    }
  });
}

validateSharedSlotUniqueGroups(extractArrayItemBlocks(dungeonLoot, "currentDungeonLootCandidates"), "current dungeon candidate");
validateSharedSlotUniqueGroups(extractArrayItemBlocks(craftedGear, "crafted gear candidate"), "crafted gear candidate");
validateSharedSlotUniqueGroups(extractArrayItemBlocks(raidLoot, "raid candidate"), "raid candidate");

if (/sourceType:\s*"raid"/.test(craftedGear) || /sourceType:\s*"raid"/.test(dungeonLoot.replace(/confidence:\s*"low"/g, ""))) {
  failures.push("Raid candidates must not be present in default dungeon/craft data.");
}

if (/"Wowhead BIS"|Upgrade Candidate|Best in Slot|DPS 수치/.test(`${dungeonLoot}\n${craftedGear}\n${raidLoot}`)) {
  failures.push("User-facing gear data contains banned wording.");
}

const midnightBlocks = extractArrayItemBlocks(midnightItems, "midnightS1Items");
const tierSetBlocks = extractArrayItemBlocks(midnightItems, "tierSetRecords");
if (!midnightBlocks.length) failures.push("midnightS1Items must contain at least one item block.");
if (!tierSetBlocks.length) failures.push("tierSetRecords must contain at least one tier set record.");
const midnightItemIds = [];
const midnightSlots = new Set();
const midnightSourceTypes = new Set();
midnightBlocks.forEach((block, index) => {
  const label = `midnight S1 item #${index + 1}`;
  const idMatch = block.match(/itemId:\s*(\d+)/);
  const itemId = idMatch?.[1];
  const slot = fieldValue(block, "slot");
  const sourceType = fieldValue(block, "sourceType");
  const recommendationState = fieldValue(block, "recommendationState");
  const nameKoVerified = boolFieldValue(block, "nameKoVerified");
  if (!itemId || itemId === "0") failures.push(`${label} must not use placeholder itemId 0.`);
  if (itemId) midnightItemIds.push(itemId);
  if (slot) midnightSlots.add(slot);
  if (sourceType) midnightSourceTypes.add(sourceType);
  if (!/nameKo:\s*"[^"]+"/.test(block)) failures.push(`${label} must include nameKo.`);
  if (!/nameKoVerified:\s*(true|false)/.test(block)) failures.push(`${label} must include nameKoVerified.`);
  if (!/slot:\s*"[A-Z0-9_]+"/.test(block)) failures.push(`${label} must include a slot.`);
  if (!/sourceType:\s*"(dungeon|raid|craft|delve|catalyst|vendor|unknown)"/.test(block)) failures.push(`${label} must include a valid sourceType.`);
  if (!/sourceNameKo:\s*"[^"]+"/.test(block)) failures.push(`${label} must include sourceNameKo.`);
  if (!/season:\s*"midnight-s1"/.test(block)) failures.push(`${label} must be tagged as midnight-s1.`);
  if (!/confidence:\s*"(high|medium|low)"/.test(block)) failures.push(`${label} must include confidence.`);
  if (!/recommendationState:\s*"(recommended|needs_check|hidden|rejected|db_missing)"/.test(block)) failures.push(`${label} must include recommendationState.`);
  if (recommendationState === "recommended" && nameKoVerified !== true) failures.push(`${label} cannot be recommended before Korean name verification.`);
  if ((sourceType === "dungeon" || sourceType === "raid") && !/sourceRefs:\s*\[/.test(block)) failures.push(`${label} ${sourceType} item must include sourceRefs.`);
  if (sourceType === "dungeon") {
    const dungeonKey = fieldValue(block, "sourceDungeonKey");
    if (!dungeonKey) failures.push(`${label} dungeon item must include sourceDungeonKey.`);
    if (dungeonKey && !seasonDungeonKeys.has(dungeonKey)) failures.push(`${label} dungeon key ${dungeonKey} is not in currentSeason dungeonPool.`);
    if (!/isSeasonalReward:\s*true/.test(block)) failures.push(`${label} dungeon item must be marked as a seasonal reward.`);
    if (!/variants:\s*mythicPlusVariants\(\d+\)/.test(block)) failures.push(`${label} dungeon item must include mythicPlusVariants.`);
  }
  if (sourceType === "raid") {
    if (!/sourceRaidKey:\s*"[a-z0-9_-]+"/.test(block)) failures.push(`${label} raid item must include sourceRaidKey.`);
    if (!/variants:\s*raidVariants\(\d+\)/.test(block)) failures.push(`${label} raid item must include raidVariants.`);
  }
  if (/slot:\s*"TRINKET_[12]"/.test(block)) {
    if (!/uniqueEquipGroup:\s*"[^"]+"/.test(block)) failures.push(`${label} shared trinket slot must include uniqueEquipGroup.`);
    if (!/trinketTier:\s*[^,\n]+/.test(block)) failures.push(`${label} trinket must include trinketTier.`);
    if (!/tier:\s*"(S|A|B|C|주의)"/.test(block)) failures.push(`${label} trinket tier must include tier.`);
    if (!/contentFocus:\s*"(mythic_plus|raid|balanced)"/.test(block)) failures.push(`${label} trinket tier must include contentFocus.`);
    if (!/needsSim:\s*(true|false)/.test(block)) failures.push(`${label} trinket tier must include needsSim.`);
    if (!/sources:\s*\[/.test(block)) failures.push(`${label} trinket tier must include sources.`);
  }
  if (/slot:\s*"FINGER_[12]"/.test(block) && !/uniqueEquipGroup:\s*"[^"]+"/.test(block)) {
    failures.push(`${label} shared ring slot must include uniqueEquipGroup.`);
  }
  if (/isTierPiece:\s*true/.test(block)) {
    if (!/setBonusKey:\s*"[^"]+"/.test(block)) failures.push(`${label} tier piece must include setBonusKey.`);
    if (!/sourceRefs:\s*\[/.test(block)) failures.push(`${label} tier piece must include sourceRefs.`);
    if (!/variants:\s*raidVariants\(\d+\)/.test(block)) failures.push(`${label} tier piece must include raidVariants.`);
    if (recommendationState === "recommended") failures.push(`${label} tier piece must not be auto-promoted before set/sim validation.`);
  }
});

const midnightDuplicates = midnightItemIds.filter((id, index) => midnightItemIds.indexOf(id) !== index);
if (midnightDuplicates.length) failures.push(`Duplicate midnight itemId values found: ${Array.from(new Set(midnightDuplicates)).join(", ")}`);
const requiredSlotFamilies = [
  ["HEAD"],
  ["NECK"],
  ["SHOULDER"],
  ["BACK"],
  ["CHEST"],
  ["WRIST"],
  ["HANDS"],
  ["WAIST"],
  ["LEGS"],
  ["FEET"],
  ["FINGER_1", "FINGER_2"],
  ["TRINKET_1", "TRINKET_2"],
  ["MAIN_HAND"],
  ["OFF_HAND"],
];
requiredSlotFamilies.forEach((family) => {
  if (!family.some((slot) => midnightSlots.has(slot))) failures.push(`Midnight S1 DB lacks slot coverage for ${family.join("/")}.`);
});
if (!midnightSourceTypes.has("dungeon")) failures.push("Midnight S1 DB must include dungeon items.");
if (!midnightSourceTypes.has("raid")) failures.push("Midnight S1 DB must include raid items.");
if (midnightBlocks.length < 30) failures.push(`Midnight S1 DB is too sparse: expected at least 30 items, found ${midnightBlocks.length}.`);
const tierSetClassKeys = new Set(tierSetBlocks.map((block) => fieldValue(block, "classKey")).filter(Boolean));
["rogue", "demon-hunter"].forEach((classKey) => {
  if (!tierSetClassKeys.has(classKey)) failures.push(`tierSetRecords must include ${classKey} coverage.`);
});
tierSetBlocks.forEach((block, index) => {
  const label = `tier set #${index + 1}`;
  if (!/setBonusKey:\s*"[^"]+"/.test(block)) failures.push(`${label} must include setBonusKey.`);
  if (!/classKey:\s*"(rogue|demon-hunter)"/.test(block)) failures.push(`${label} must include classKey.`);
  if (!/sourceRefs:\s*\[/.test(block)) failures.push(`${label} must include sourceRefs.`);
  const itemIdSection = block.match(/itemIds:\s*\[([^\]]+)\]/s)?.[1] || "";
  const tierItemIds = Array.from(itemIdSection.matchAll(/\d+/g)).map((match) => match[0]);
  if (tierItemIds.length < 5) failures.push(`${label} must include at least 5 tier itemIds.`);
  tierItemIds.forEach((id) => {
    if (!midnightItemIds.includes(id)) failures.push(`${label} references itemId ${id}, but it is not present in midnightS1Items.`);
  });
  if (!/pieces:\s*2/.test(block) || !/pieces:\s*4/.test(block)) failures.push(`${label} must include 2-piece and 4-piece summaries.`);
});

if (/"예시|Example/.test(midnightItems)) failures.push("Midnight S1 item DB must not expose example placeholder data.");
if (!/keyLevel:\s*10,\s*endItemLevel:\s*266,\s*endTrack:\s*"hero",\s*endRank:\s*3,\s*vaultItemLevel:\s*272,\s*vaultTrack:\s*"myth",\s*vaultRank:\s*1/.test(midnightItems)) {
  failures.push("Midnight S1 Mythic+ variant table must include +10 end/vault Hero/Myth values.");
}
if (!/variantId:/.test(midnightItems) || !/itemLevel:/.test(midnightItems) || !/track:/.test(midnightItems) || !/rank:/.test(midnightItems) || !/maxRank:/.test(midnightItems) || !/sourceRef:/.test(midnightItems)) {
  failures.push("Season item variants must define variantId, itemLevel, track, rank, maxRank, and sourceRef.");
}

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
if (failures.length) {
  failures.forEach((failure) => console.error(`Error: ${failure}`));
  process.exit(1);
}

console.log(`Gear season validation passed (${itemIds.length} legacy candidates, ${midnightBlocks.length} midnight DB items checked).`);
