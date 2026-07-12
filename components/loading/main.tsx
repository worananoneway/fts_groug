export default function Loading() {
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white"
            role="status"
            aria-live="polite"
        >
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-slate-700" />

            <span className="text-sm text-gray-600">
                กำลังโหลด...
            </span>
        </div>
    );
}