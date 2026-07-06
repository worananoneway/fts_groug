/**
 * Guillotine packing algorithm for the steel sheet cutting optimizer.
 */

export type CutItem = {
    id: number;
    code: string;
    w: number;
    h: number;
    qty: number;
    color: string;
};

export type PlacedPiece = {
    code: string;
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    rotated: boolean;
};

export type FreeRect = { x: number; y: number; w: number; h: number };

export type PackedSheet = {
    pieces: PlacedPiece[];
    freeRects: FreeRect[];
};

export type PackResult = {
    sheets: PackedSheet[];
    unplaced: { code: string; w: number; h: number }[];
};

export function pack_guillotine(
    sheetW: number,
    sheetH: number,
    kerf: number,
    items: CutItem[],
): PackResult {
    const queue = items
        .flatMap((it) =>
            Array.from({ length: it.qty }, () => ({
                code: it.code,
                w: it.w,
                h: it.h,
                color: it.color,
            })),
        )
        .sort((a, b) => b.w * b.h - a.w * a.h);

    const sheets: PackedSheet[] = [];
    const unplaced: PackResult["unplaced"] = [];

    const fits = (fr: FreeRect, w: number, h: number) => w <= fr.w && h <= fr.h;

    for (const piece of queue) {
        let placed = false;

        for (const sheet of sheets) {
            // best short-side fit across free rects, allowing rotation
            let best: { idx: number; rotated: boolean; score: number } | null = null;
            sheet.freeRects.forEach((fr, idx) => {
                for (const rotated of [false, true]) {
                    const w = rotated ? piece.h : piece.w;
                    const h = rotated ? piece.w : piece.h;
                    if (!fits(fr, w, h)) continue;
                    const score = Math.min(fr.w - w, fr.h - h);
                    if (!best || score < best.score) best = { idx, rotated, score };
                }
            });
            if (!best) continue;

            const { idx, rotated } = best as { idx: number; rotated: boolean; score: number };
            const fr = sheet.freeRects[idx];
            const w = rotated ? piece.h : piece.w;
            const h = rotated ? piece.w : piece.h;

            sheet.pieces.push({ code: piece.code, x: fr.x, y: fr.y, w, h, color: piece.color, rotated });
            sheet.freeRects.splice(idx, 1);
            split_free_rect(sheet, fr, w, h, kerf);
            placed = true;
            break;
        }

        if (placed) continue;

        // open a new sheet if the piece can fit at all
        const canFit =
            (piece.w <= sheetW && piece.h <= sheetH) ||
            (piece.h <= sheetW && piece.w <= sheetH);
        if (!canFit) {
            unplaced.push({ code: piece.code, w: piece.w, h: piece.h });
            continue;
        }
        const rotated = !(piece.w <= sheetW && piece.h <= sheetH);
        const w = rotated ? piece.h : piece.w;
        const h = rotated ? piece.w : piece.h;
        const sheet: PackedSheet = { pieces: [], freeRects: [] };
        sheet.pieces.push({ code: piece.code, x: 0, y: 0, w, h, color: piece.color, rotated });
        split_free_rect(sheet, { x: 0, y: 0, w: sheetW, h: sheetH }, w, h, kerf);
        sheets.push(sheet);
    }

    return { sheets, unplaced };
}

/** guillotine split of a free rect after placing a w×h piece at its origin, with kerf allowance */
function split_free_rect(sheet: PackedSheet, fr: FreeRect, w: number, h: number, kerf: number) {
    const rightW = fr.w - w - kerf;
    const bottomH = fr.h - h - kerf;
    if (rightW > bottomH) {
        if (rightW > 0) sheet.freeRects.push({ x: fr.x + w + kerf, y: fr.y, w: rightW, h: fr.h });
        if (bottomH > 0) sheet.freeRects.push({ x: fr.x, y: fr.y + h + kerf, w, h: bottomH });
    } else {
        if (bottomH > 0) sheet.freeRects.push({ x: fr.x, y: fr.y + h + kerf, w: fr.w, h: bottomH });
        if (rightW > 0) sheet.freeRects.push({ x: fr.x + w + kerf, y: fr.y, w: rightW, h });
    }
}
