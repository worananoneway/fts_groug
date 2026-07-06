"use client";

import { useCallback, useMemo, useState } from "react";
import { CutItem, PackResult, pack_guillotine } from "../app/lib/guillotine";

export const ITEM_COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#14b8a6", // teal
    "#ec4899", // pink
    "#84cc16", // lime
];

export type Scrap = { x: number; y: number; w: number; h: number; sheetNo: number };

/**
 * Hook holding the cutting-plan state: sheet settings, cut items,
 * and the packed result + reclaimable scraps from the last calculation.
 */
export function useCuttingPlan() {
    const [sheetW, setSheetW] = useState(2400);
    const [sheetH, setSheetH] = useState(1200);
    const [kerf, setKerf] = useState(3);
    const [minScrap, setMinScrap] = useState(150);

    const [items, setItems] = useState<CutItem[]>([
        { id: 1, code: "A", w: 600, h: 400, qty: 3, color: ITEM_COLORS[0] },
        { id: 2, code: "B", w: 800, h: 300, qty: 2, color: ITEM_COLORS[1] },
        { id: 3, code: "C", w: 400, h: 400, qty: 4, color: ITEM_COLORS[2] },
        { id: 4, code: "D", w: 500, h: 200, qty: 3, color: ITEM_COLORS[3] },
    ]);
    const [nextId, setNextId] = useState(5);
    const [result, setResult] = useState<PackResult | null>(null);

    const totalPieces = useMemo(() => items.reduce((s, it) => s + it.qty, 0), [items]);

    const scraps: Scrap[] = useMemo(() => {
        if (!result) return [];
        return result.sheets.flatMap((sheet, si) =>
            sheet.freeRects
                .filter((fr) => fr.w >= minScrap && fr.h >= minScrap)
                .map((fr) => ({ ...fr, sheetNo: si + 1 })),
        );
    }, [result, minScrap]);

    const addItem = useCallback(
        (code: string, w: number, h: number, qty: number) => {
            if (!w || !h || w <= 0 || h <= 0) return;
            setItems((prev) => [
                ...prev,
                {
                    id: nextId,
                    code,
                    w,
                    h,
                    qty: Math.max(1, Math.floor(qty || 1)),
                    color: ITEM_COLORS[prev.length % ITEM_COLORS.length],
                },
            ]);
            setNextId((n) => n + 1);
        },
        [nextId],
    );

    const removeItem = useCallback((id: number) => {
        setItems((prev) => prev.filter((it) => it.id !== id));
    }, []);

    const calculate = useCallback(() => {
        if (items.length === 0) return false;
        setResult(pack_guillotine(sheetW, sheetH, kerf, items));
        return true;
    }, [items, sheetW, sheetH, kerf]);

    return {
        sheetW, setSheetW,
        sheetH, setSheetH,
        kerf, setKerf,
        minScrap, setMinScrap,
        items, addItem, removeItem, totalPieces,
        result, scraps, calculate,
    };
}
