"use client";

import { EmptyState } from "../../ui/empty-state";
import { CalculationSummary } from "../shared/calculation-summary";
import { UnfulfilledAlert } from "../shared/unfulfilled-alert";
import { fmt } from "../mappers";
import { PlateLayoutCanvas } from "./plate-layout-canvas";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateLayoutTab() {
  const {
    plateAverageUtilization,
    plateResult,
    plateScraps,
    selectedPlate,
    sheetH,
    sheetW,
  } = useCalculationDivision();

  if (!plateResult) {
    return <EmptyState>ยังไม่มีแผนการตัด ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>;
  }

  const unfulfilledMessage =
    plateResult.unplaced.length > 0
      ? `มี ${plateResult.unplaced.length} ชิ้นที่ใหญ่เกินแผ่นเหล็ก: ${plateResult.unplaced
          .map((item) => `${item.code} (${fmt(item.w)}x${fmt(item.h)})`)
          .join(", ")}`
      : "";

  return (
    <div className="space-y-6">
      <UnfulfilledAlert message={unfulfilledMessage} />
      <CalculationSummary
        averageUtilization={plateAverageUtilization}
        scrapCount={plateScraps.length}
        sourceCount={plateResult.sheets.length}
        sourceLabel="จำนวนแผ่นที่ใช้"
      />
      {plateResult.sheets.map((sheet, index) => (
        <PlateLayoutCanvas
          key={index}
          sheet={sheet}
          sheetH={sheetH}
          sheetNo={index + 1}
          sheetW={sheetW}
          sourceCode={selectedPlate?.code}
        />
      ))}
    </div>
  );
}

