"use client";

import { useEffect, useState } from "react";

/* =============================================================================
 * โครงจำลอง (skeleton) สำหรับตอนกำลังโหลด — ใช้แทนสปินเนอร์เมื่ออยากให้เห็นเค้าโครงหน้า
 *
 *   <SkeletonTable columns={6} rows={8} />   โครงตาราง
 *   <SkeletonCards count={4} />              โครงการ์ดสถิติแถวบน
 *   <SkeletonText lines={3} />               โครงข้อความ
 *   <Skeleton className="h-10 w-40" />       บล็อกเปล่า ๆ ปรับขนาดเอง
 *
 * ใช้คู่กับ LoadingGate ได้เลย:
 *   <LoadingGate isLoading={isLoading} fallback={<SkeletonTable />}>...</LoadingGate>
 * ============================================================================= */

/**
 * ตอน render ฝั่ง server ส่ง DOM น้อย ๆ ไปก่อน แล้วค่อยขยายเต็มหลัง mount
 * (โครงตารางแถวเยอะ ๆ ที่ถูกส่งมาพร้อม HTML ก้อนแรก ทำให้ streaming SSR
 *  ของ Next บาง environment ค้างที่ loading.tsx — ส่งน้อยก่อนแล้วขยายทีหลังปลอดภัยกว่า)
 */
function useMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setMounted(true);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */
    return mounted;
}

/** บล็อกสีเทาเรืองแสง — ชิ้นส่วนพื้นฐานของ skeleton ทุกตัว */
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
    return <div aria-hidden className={`animate-pulse rounded-md bg-slate-200/80 ${className}`} />;
}

/** โครงข้อความหลายบรรทัด */
export function SkeletonText({
    lines = 3,
    className = "",
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={`flex flex-col gap-2 ${className}`} role="status" aria-busy="true" aria-live="polite">
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    className={index === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"}
                />
            ))}
        </div>
    );
}

/** โครงตาราง — จำนวนคอลัมน์/แถวปรับได้ ให้ใกล้เคียงตารางจริงของหน้านั้น */
export function SkeletonTable({
    columns = 6,
    rows = 8,
    className = "",
}: {
    columns?: number;
    rows?: number;
    className?: string;
}) {
    const mounted = useMounted();
    const visibleRows = mounted ? rows : Math.min(rows, 2);
    return (
        <div className={className} role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">กำลังโหลดข้อมูล...</span>

            <div className="flex gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                {Array.from({ length: columns }).map((_, index) => (
                    <Skeleton key={index} className="h-3.5 flex-1" />
                ))}
            </div>

            {Array.from({ length: visibleRows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4 border-b border-slate-50 px-5 py-4">
                    {Array.from({ length: columns }).map((_, columnIndex) => (
                        <Skeleton
                            key={columnIndex}
                            className={columnIndex === 0 ? "h-4 flex-1 opacity-90" : "h-4 flex-1"}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

/** โครงการ์ด (เช่น การ์ดสถิติแถวบนของแดชบอร์ด) */
export function SkeletonCard({ className = "" }: { className?: string }) {
    return (
        <div className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm ${className}`}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
        </div>
    );
}

/** โครงการ์ดหลายใบเรียงเป็นกริด */
export function SkeletonCards({
    count = 4,
    className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
}: {
    count?: number;
    className?: string;
}) {
    return (
        <div className={className} role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">กำลังโหลดข้อมูล...</span>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}
