"use client";

import {
    createContext,
    Suspense,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import Loading from "./main";

// กันค้าง: ถ้าเปลี่ยนหน้าไม่สำเร็จภายใน 15 วิ ให้ปิดสปินเนอร์เอง
const SAFETY_TIMEOUT_MS = 15_000;

interface RouteLoadingValue {
    isLoading: boolean;
    startLoading: (label?: string) => void;
    stopLoading: () => void;
}

const RouteLoadingContext = createContext<RouteLoadingValue>({
    isLoading: false,
    startLoading: () => { },
    stopLoading: () => { },
});

/** ใช้ในคอมโพเนนต์ที่สั่งเปลี่ยนหน้าเองด้วย router.push/replace */
export function useRouteLoading(): RouteLoadingValue {
    return useContext(RouteLoadingContext);
}

/**
 * แสดงหน้าโหลดทุกครั้งที่มีการเปลี่ยนหน้า
 * - ดักคลิกลิงก์ภายในทุกอัน (<Link> / <a>) และปุ่ม back/forward ของเบราว์เซอร์
 * - ปิดเองเมื่อ pathname หรือ query string เปลี่ยนเสร็จแล้ว
 */
export function RouteTransitionProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(false);
    const [label, setLabel] = useState<string | undefined>(undefined);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startLoading = useCallback(
        (nextLabel?: string) => {
            clearTimer();
            setLabel(nextLabel);
            setIsLoading(true);
            timerRef.current = setTimeout(() => setIsLoading(false), SAFETY_TIMEOUT_MS);
        },
        [clearTimer],
    );

    const stopLoading = useCallback(() => {
        clearTimer();
        setIsLoading(false);
    }, [clearTimer]);

    useEffect(() => clearTimer, [clearTimer]);

    // ดักคลิกลิงก์ภายในทั้งหมด — ครอบทุกหน้าโดยไม่ต้องแก้ที่ลิงก์แต่ละอัน
    useEffect(() => {
        function handleClick(event: MouseEvent) {
            if (event.defaultPrevented) return;
            if (event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const target = event.target as Element | null;
            const anchor = target?.closest?.("a");
            if (!anchor) return;
            if (anchor.hasAttribute("download")) return;
            if (anchor.target && anchor.target !== "_self") return;

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

            let url: URL;
            try {
                url = new URL(anchor.href, window.location.href);
            } catch {
                return;
            }
            if (url.origin !== window.location.origin) return;

            const current = `${window.location.pathname}${window.location.search}`;
            if (`${url.pathname}${url.search}` === current) return;

            startLoading();
        }

        function handlePopState() {
            startLoading();
        }

        document.addEventListener("click", handleClick, true);
        window.addEventListener("popstate", handlePopState);
        return () => {
            document.removeEventListener("click", handleClick, true);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [startLoading]);

    return (
        <RouteLoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}

            {/* useSearchParams ต้องอยู่ใน Suspense เพื่อไม่ให้ทั้ง layout กลายเป็น dynamic */}
            <Suspense fallback={null}>
                <RouteChangeWatcher onSettled={stopLoading} />
            </Suspense>

            {isLoading ? <Loading label={label} /> : null}
        </RouteLoadingContext.Provider>
    );
}

function RouteChangeWatcher({ onSettled }: { onSettled: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        onSettled();
    }, [pathname, searchParams, onSettled]);

    return null;
}
