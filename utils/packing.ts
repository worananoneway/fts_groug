import type {
  FreeRect,
  PlateItem,
  PlateResult,
  PlateSheet,
  RoundBarLayout,
  RoundItem,
  RoundResult,
} from "@/types/division";

export function nextCode(used: string[]): string {
  for (let i = 0; i < 26; i += 1) {
    const candidate = String.fromCharCode(65 + i);
    if (!used.includes(candidate)) return candidate;
  }
  return `X${used.length + 1}`;
}

function splitFreeRect(sheet: PlateSheet, freeRect: FreeRect, w: number, h: number, kerf: number) {
  const rightW = freeRect.w - w - kerf;
  const bottomH = freeRect.h - h - kerf;

  if (rightW > bottomH) {
    if (rightW > 0) {
      sheet.freeRects.push({ x: freeRect.x + w + kerf, y: freeRect.y, w: rightW, h: freeRect.h });
    }
    if (bottomH > 0) {
      sheet.freeRects.push({ x: freeRect.x, y: freeRect.y + h + kerf, w, h: bottomH });
    }
  } else {
    if (bottomH > 0) {
      sheet.freeRects.push({ x: freeRect.x, y: freeRect.y + h + kerf, w: freeRect.w, h: bottomH });
    }
    if (rightW > 0) {
      sheet.freeRects.push({ x: freeRect.x + w + kerf, y: freeRect.y, w: rightW, h });
    }
  }
}

export function packGuillotine(sheetW: number, sheetH: number, kerf: number, items: PlateItem[]): PlateResult {
  const queue = items
    .flatMap((item) =>
      Array.from({ length: item.qty }, () => ({
        code: item.code,
        w: item.w,
        h: item.h,
        color: item.color,
        orderDetailId: item.orderDetailId,
      })),
    )
    .sort((a, b) => b.w * b.h - a.w * a.h);

  const sheets: PlateSheet[] = [];
  const unplaced: PlateResult["unplaced"] = [];

  const fits = (freeRect: FreeRect, w: number, h: number) => w <= freeRect.w && h <= freeRect.h;

  for (const piece of queue) {
    let placed = false;

    for (const sheet of sheets) {
      let best: { idx: number; rotated: boolean; score: number } | null = null;

      for (let idx = 0; idx < sheet.freeRects.length; idx += 1) {
        const freeRect = sheet.freeRects[idx];
        for (const rotated of [false, true] as const) {
          const w = rotated ? piece.h : piece.w;
          const h = rotated ? piece.w : piece.h;
          if (!fits(freeRect, w, h)) continue;

          const score = Math.min(freeRect.w - w, freeRect.h - h);
          if (!best || score < best.score) best = { idx, rotated, score };
        }
      }

      if (!best) continue;

      const freeRect = sheet.freeRects[best.idx];
      const w = best.rotated ? piece.h : piece.w;
      const h = best.rotated ? piece.w : piece.h;
      sheet.pieces.push({
        code: piece.code,
        x: freeRect.x,
        y: freeRect.y,
        w,
        h,
        color: piece.color,
        orderDetailId: piece.orderDetailId,
        rotated: best.rotated,
      });
      sheet.freeRects.splice(best.idx, 1);
      splitFreeRect(sheet, freeRect, w, h, kerf);
      placed = true;
      break;
    }

    if (placed) continue;

    const canFit = (piece.w <= sheetW && piece.h <= sheetH) || (piece.h <= sheetW && piece.w <= sheetH);
    if (!canFit) {
      unplaced.push({ code: piece.code, w: piece.w, h: piece.h });
      continue;
    }

    const rotated = !(piece.w <= sheetW && piece.h <= sheetH);
    const w = rotated ? piece.h : piece.w;
    const h = rotated ? piece.w : piece.h;
    const sheet: PlateSheet = { pieces: [], freeRects: [] };
    sheet.pieces.push({ code: piece.code, x: 0, y: 0, w, h, color: piece.color, orderDetailId: piece.orderDetailId, rotated });
    splitFreeRect(sheet, { x: 0, y: 0, w: sheetW, h: sheetH }, w, h, kerf);
    sheets.push(sheet);
  }

  return { sheets, unplaced };
}

export function packRoundBars(barLength: number, kerf: number, items: RoundItem[]): RoundResult {
  const queue = items
    .flatMap((item) =>
      Array.from({ length: item.qty }, () => ({
        code: item.code,
        length: item.length,
        color: item.color,
        orderDetailId: item.orderDetailId,
      })),
    )
    .sort((a, b) => b.length - a.length);

  const bars: RoundBarLayout[] = [];
  const unplaced: RoundResult["unplaced"] = [];

  for (const piece of queue) {
    if (piece.length > barLength) {
      unplaced.push(piece);
      continue;
    }

    let target: RoundBarLayout | null = null;
    for (const bar of bars) {
      const needed = bar.pieces.length > 0 ? piece.length + kerf : piece.length;
      if (bar.used + needed <= barLength) {
        target = bar;
        break;
      }
    }

    if (!target) {
      target = { pieces: [], used: 0 };
      bars.push(target);
    }

    const start = target.used + (target.pieces.length > 0 ? kerf : 0);
    target.pieces.push({ code: piece.code, start, length: piece.length, color: piece.color, orderDetailId: piece.orderDetailId });
    target.used = start + piece.length;
  }

  return { bars, unplaced };
}
