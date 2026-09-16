"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRouteLoading } from "@/components/loading/route-transition";

export function useNavigate() {
    const router = useRouter();
    const { startLoading } = useRouteLoading();

    const push = useCallback(
        (href: string, label?: string) => {
            startLoading(label);
            router.push(href);
        },
        [router, startLoading],
    );

    const replace = useCallback(
        (href: string, label?: string) => {
            startLoading(label);
            router.replace(href);
        },
        [router, startLoading],
    );

    // เปลี่ยน URL เฉย ๆ (เช่น ล้าง query params ของหน้าเดิม) — ไม่ต้องขึ้นหน้าโหลด
    const silentReplace = useCallback(
        (href: string) => {
            router.replace(href);
        },
        [router],
    );

    return { push, replace, silentReplace, router };
}
