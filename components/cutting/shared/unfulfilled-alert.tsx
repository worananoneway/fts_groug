import { AlertBanner } from "../../ui/alert-banner";

export interface UnfulfilledItem {
  /** ป้ายชื่อชิ้นงาน เช่น "P1 · 300×600 มม." */
  label: string;
  count: number;
}

/**
 * เตือนว่ามีชิ้นงานที่วางลงเหล็กต้นทางไม่ได้
 * รวมชิ้นที่ซ้ำกันเป็นบรรทัดเดียว (× จำนวน) — เดิมไล่พิมพ์ทีละชิ้นจนอ่านไม่ไหว
 */
export function UnfulfilledAlert({
  items,
  total,
  hint,
}: {
  items: UnfulfilledItem[];
  total: number;
  hint?: string;
}) {
  if (items.length === 0 || total === 0) return null;

  return (
    <AlertBanner tone="danger">
      <p className="font-semibold">มี {total} ชิ้นที่วางลงเหล็กต้นทางไม่ได้ (ใหญ่/ยาวเกิน)</p>
      <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {items.map((item) => (
          <li key={item.label} className="font-mono">
            {item.label}
            {item.count > 1 ? <span className="text-red-500"> × {item.count}</span> : null}
          </li>
        ))}
      </ul>
      {hint ? <p className="mt-2 text-xs text-red-600/90">{hint}</p> : null}
    </AlertBanner>
  );
}

/** รวมรายการที่ซ้ำกันเป็น {label, count} */
export function groupUnfulfilled(labels: string[]): UnfulfilledItem[] {
  const counts = new Map<string, number>();
  for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}
