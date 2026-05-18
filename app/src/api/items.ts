import type { ItemTooltipData } from "../types";

export class ItemTooltipError extends Error {
  constructor(message: string, public status = 0) {
    super(message);
  }
}

export async function requestItemTooltip(itemId: number, region = "kr", locale = "ko_KR"): Promise<ItemTooltipData> {
  const params = new URLSearchParams({
    itemId: String(itemId),
    region,
    locale,
  });
  const res = await fetch(`/api/items/tooltip?${params.toString()}`);
  const data = (await res.json().catch(() => ({}))) as ItemTooltipData & { error?: string };
  if (!res.ok) throw new ItemTooltipError(data.error || `아이템 툴팁 조회 실패 (${res.status})`, res.status);
  return data;
}
