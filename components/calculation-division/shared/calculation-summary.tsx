import { StatCard } from "../../ui/stat-card";

export function CalculationSummary({
  averageUtilization,
  sourceCount,
  sourceLabel,
  scrapCount,
}: {
  averageUtilization: string;
  sourceCount: number;
  sourceLabel: string;
  scrapCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label={sourceLabel} value={`${sourceCount} ชิ้น`} />
      <StatCard label="การใช้พื้นที่/ความยาวเฉลี่ย" value={`${averageUtilization}%`} />
      <StatCard label="เศษที่เก็บได้" value={`${scrapCount} ชิ้น`} />
    </div>
  );
}

