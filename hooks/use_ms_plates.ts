"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CreateMsPlateInput,
    MsPlate,
    SCRAP_CODE_PREFIX,
    create_ms_plate,
    delete_ms_plate,
    list_ms_plates,
} from "../app/lib/ms_plates_api";

/**
 * Hook wrapping the ms_plates backend module.
 * Splits inventory into stock plates (แผ่นเต็ม) and scrap plates
 * (เศษที่บันทึกไว้ — code ขึ้นต้นด้วย SCRAP-).
 */
export function useMsPlates() {
    const [plates, setPlates] = useState<MsPlate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setPlates(await list_ms_plates());
        } catch (e) {
            setError(e instanceof Error ? e.message : "เชื่อมต่อหลังบ้านไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refetch();
    }, [refetch]);

    const create = useCallback(
        async (input: CreateMsPlateInput) => {
            await create_ms_plate(input);
            await refetch();
        },
        [refetch],
    );

    const remove = useCallback(async (id: string) => {
        await delete_ms_plate(id);
        setPlates((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const stockPlates = useMemo(
        () => plates.filter((p) => !p.code?.startsWith(SCRAP_CODE_PREFIX)),
        [plates],
    );
    const scrapPlates = useMemo(
        () => plates.filter((p) => p.code?.startsWith(SCRAP_CODE_PREFIX)),
        [plates],
    );

    return { plates, stockPlates, scrapPlates, loading, error, refetch, create, remove };
}
