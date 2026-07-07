import { StatCard } from "../../ui/stat-card";
import { cn } from "../../ui/button";

export function CalculationSummary({
  averageUtilization,
  sourceCount,
  sourceLabel,
  scrapCount,
  vertical = false,
}: {
  averageUtilization: string;
  sourceCount: number;
  sourceLabel: string;
  scrapCount: number;
  vertical?: boolean;
}) {
  return (
    <div className={cn("grid gap-4", vertical ? "grid-cols-1" : "sm:grid-cols-3")}>
      <StatCard label={sourceLabel} value={`${sourceCount} ชิ้น`} />
      <StatCard label="การใช้พื้นที่/ความยาวเฉลี่ย" value={`${averageUtilization}%`} />
      <StatCard label="เศษที่เก็บได้" value={`${scrapCount} ชิ้น`} />
    </div>
  );
}

