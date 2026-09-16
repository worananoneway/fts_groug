"use client";

import { useCallback, useRef, useState } from "react";

/**
 * state "กำลังโหลด" สำหรับงาน async ในหน้า — ใช้ชื่อ isLoading เหมือนกันทุกที่
 *
 *   const { isLoading, run } = useLoading();
 *   ...
 *   <Button isLoading={isLoading} onClick={() => run(() => saveOrder(form))}>บันทึก</Button>
 *   <LoadingGate isLoading={isLoading}>...</LoadingGate>
 *
 * run() จะเปิด/ปิด isLoading ให้เอง ไม่ว่างานจะสำเร็จหรือ throw
 * (ถ้าคอมโพเนนต์ถูก unmount ไปแล้วจะไม่ setState ซ้ำ)
 */
export function useLoading(initial = false) {
    const [isLoading, setIsLoading] = useState(initial);
    const pending = useRef(0);

    const start = useCallback(() => {
        pending.current += 1;
        setIsLoading(true);
    }, []);

    const stop = useCallback(() => {
        pending.current = Math.max(0, pending.current - 1);
        if (pending.current === 0) setIsLoading(false);
    }, []);

    /** ครอบงาน async ให้เปิด/ปิด isLoading อัตโนมัติ แล้วคืนค่าที่งานนั้นคืนมา */
    const run = useCallback(
        async <T,>(task: () => Promise<T>): Promise<T> => {
            start();
            try {
                return await task();
            } finally {
                stop();
            }
        },
        [start, stop],
    );

    return { isLoading, start, stop, run, setIsLoading };
}
