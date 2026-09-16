/**
 * ทางเข้าเดียวของทุกอย่างที่เกี่ยวกับสถานะโหลด
 *
 *   import { LoadingGate, SkeletonTable, useLoading } from "@/components/loading";
 *
 * ดูวิธีใช้แต่ละตัวได้ที่ components/loading/README.md
 */
export {
    default as PageLoading,
    Loading,
    LoadFailed,
    LoadingBlock,
    LoadingGate,
    LoadingOverlay,
    LoadingSpinner,
    InlineLoading,
    createPageLoading,
} from "./main";

export { Skeleton, SkeletonCard, SkeletonCards, SkeletonTable, SkeletonText } from "./skeleton";

export { useLoading } from "./use-loading";

export { RouteTransitionProvider, useRouteLoading } from "./route-transition";
