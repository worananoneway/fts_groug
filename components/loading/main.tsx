import type { ReactNode } from "react";

/* =============================================================================
 * ชุดคอมโพเนนต์สถานะ "กำลังโหลด" ของทั้งระบบ — ใช้ที่นี่ที่เดียว ห้ามเขียนสปินเนอร์เอง
 *
 *   <PageLoading />                     เต็มหน้าจอ (loading.tsx ของ route / ตอนเปลี่ยนหน้า)
 *   createPageLoading("กำลังโหลด...")   ตัวช่วยเขียน loading.tsx ให้เหลือบรรทัดเดียว
 *   <LoadingBlock />                    ในหน้า แทนที่ตาราง/การ์ดตอนยังไม่มีข้อมูล
 *   <LoadingOverlay isLoading />        ทับพื้นที่เดิมตอนรีเฟรชข้อมูลที่มีอยู่แล้ว
 *   <LoadingGate isLoading>...</...>    ครอบส่วนที่โหลด: โหลด = สปินเนอร์, เสร็จ = children
 *                                       (ส่ง error + onRetry เข้าไปด้วยได้ ถ้าโหลดไม่สำเร็จ)
 *   <InlineLoading isLoading />         ป้ายเล็ก ๆ ข้างหัวข้อ/ปุ่ม
 *
 * โครงชุดตาราง/การ์ดแบบ skeleton อยู่ที่ ./skeleton
 * state สำหรับงาน async ในหน้า ใช้ hook ./use-loading  →  const { isLoading, run } = useLoading()
 * ============================================================================= */

/** วงกลมหมุน — ชิ้นส่วนพื้นฐานของทุกคอมโพเนนต์ในไฟล์นี้ */
export function LoadingSpinner({ className = "h-10 w-10" }: { className?: string }) {
    return (
        <div
            className={`${className} animate-spin rounded-full border-4 border-gray-200 border-t-slate-700`}
        />
    );
}

/**
 * โหลดเต็มหน้าจอ — ใช้เป็น fallback ของ loading.tsx ทุก route
 * และใช้ตอนเปลี่ยนหน้า (RouteTransitionProvider)
 */
export default function PageLoading({ label = "กำลังโหลด..." }: { label?: string }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-white"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <LoadingSpinner />

            <span className="text-sm text-gray-600">
                {label}
            </span>
        </div>
    );
}

/** ชื่อเดิม — เผื่อไฟล์ที่ยัง import แบบ { Loading } */
export const Loading = PageLoading;

/**
 * ตัวช่วยสร้าง loading.tsx ของ route
 *
 *   // app/(division)/po/loading.tsx
 *   export default createPageLoading("กำลังโหลดใบสั่งซื้อ...");
 */
export function createPageLoading(label?: string) {
    const RouteLoading = () => <PageLoading label={label} />;
    RouteLoading.displayName = `RouteLoading(${label ?? "default"})`;
    return RouteLoading;
}

/** โหลดแบบอยู่ในหน้า — ใช้แทนตาราง/การ์ดตอนข้อมูลยังมาไม่ถึง */
export function LoadingBlock({
    label = "กำลังโหลดข้อมูล...",
    className = "",
}: {
    label?: string;
    className?: string;
}) {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-3 p-10 ${className}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <LoadingSpinner className="h-8 w-8" />

            <span className="text-sm text-slate-500">{label}</span>
        </div>
    );
}

/** โหลดแบบทับพื้นที่เดิม (parent ต้องเป็น relative) — ใช้ตอนรีเฟรชข้อมูลที่มีอยู่แล้ว */
export function LoadingOverlay({
    label = "กำลังโหลด...",
    isLoading = true,
}: {
    label?: string;
    isLoading?: boolean;
}) {
    if (!isLoading) return null;
    return (
        <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <LoadingSpinner className="h-8 w-8" />

            <span className="text-sm text-slate-600">{label}</span>
        </div>
    );
}

/**
 * ครอบส่วนที่โหลดข้อมูล — จัดการ 3 สถานะให้ในตัวเดียว
 *   โหลดไม่สำเร็จ = ข้อความ + ปุ่มลองใหม่ / กำลังโหลด = สปินเนอร์หรือ skeleton / เสร็จ = children
 *
 *   <LoadingGate
 *     isLoading={dataStatus.isLoading}
 *     error={dataStatus.error}
 *     onRetry={() => void load()}
 *     label="กำลังโหลดใบสั่งซื้อ..."
 *   >
 *     <PurchaseOrderPanel />
 *   </LoadingGate>
 *
 * ถ้าอยากให้ตอนโหลดเป็นโครงตาราง ส่ง fallback เข้ามา เช่น
 *   <LoadingGate isLoading={isLoading} fallback={<SkeletonTable />}>
 */
export function LoadingGate({
    isLoading,
    label,
    className,
    fallback,
    error,
    onRetry,
    children,
}: {
    isLoading: boolean;
    label?: string;
    className?: string;
    fallback?: ReactNode;
    /** ข้อความ error จากการโหลด (null/undefined = ไม่มีปัญหา) */
    error?: string | null;
    /** ใส่มาแล้วจะมีปุ่ม "ลองใหม่" ให้กด */
    onRetry?: () => void;
    children: ReactNode;
}) {
    if (error && !isLoading) return <LoadFailed className={className} error={error} onRetry={onRetry} />;
    if (isLoading) return <>{fallback ?? <LoadingBlock className={className} label={label} />}</>;
    return <>{children}</>;
}

/** โหลดข้อมูลไม่สำเร็จ — บอกสาเหตุและให้กดลองใหม่ได้ (ใช้ผ่าน LoadingGate ได้เลย) */
export function LoadFailed({
    error,
    onRetry,
    className = "",
}: {
    error: string;
    onRetry?: () => void;
    className?: string;
}) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 p-10 text-center ${className}`} role="alert">
            <p className="text-sm font-semibold text-red-600">โหลดข้อมูลไม่สำเร็จ</p>
            <p className="max-w-md text-sm text-slate-500">{error}</p>
            {onRetry ? (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                    ลองใหม่
                </button>
            ) : null}
        </div>
    );
}

/** ป้าย "กำลังโหลด" ขนาดเล็กสำหรับวางข้างหัวข้อ/ปุ่ม/ช่องเลือกข้อมูล */
export function InlineLoading({
    label = "โหลด",
    isLoading = true,
    className = "",
}: {
    label?: string;
    isLoading?: boolean;
    className?: string;
}) {
    if (!isLoading) return null;
    return (
        <span
            className={`inline-flex items-center gap-1 text-xs text-blue-600 ${className}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <LoadingSpinner className="h-3.5 w-3.5 border-2" />
            {label}
        </span>
    );
}
