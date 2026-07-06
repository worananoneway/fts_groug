"use client";

import { EmptyState } from "../../ui/empty-state";
import { CalculationSummary } from "../shared/calculation-summary";
import { UnfulfilledAlert } from "../shared/unfulfilled-alert";
import { fmt } from "../mappers";
import { RoundBarLayoutCanvas } from "./round-bar-layout-canvas";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function RoundBarLayoutTab() {
  const { barDiameter, barLength, roundAverageUtilization, roundResult, roundScraps } =
    useCalculationDivision();

  if (!roundResult) {
    return <EmptyState>ยังไม่มีแผนการตัด ไปที่แท็บตั้งค่าแล้วกดคำนวณ</EmptyState>;
  }

  const unfulfilledMessage =
    roundResult.unplaced.length > 0
      ? `มี ${roundResult.unplaced.length} ชิ้นที่ยาวเกินแท่งเหล็ก: ${roundResult.unplaced
          .map((item) => `${item.code} (${fmt(item.length)} มม.)`)
          .join(", ")}`
      : "";

  return (
    <div className="space-y-6">
      <UnfulfilledAlert message={unfulfilledMessage} />
      <CalculationSummary
        averageUtilization={roundAverageUtilization}
        scrapCount={roundScraps.length}
        sourceCount={roundResult.bars.length}
        sourceLabel="จำนวนแท่งที่ใช้"
      />
      {roundResult.bars.map((bar, index) => (
        <RoundBarLayoutCanvas
          bar={bar}
          barDiameter={barDiameter}
          barLength={barLength}
          barNo={index + 1}
          key={index}
        />
      ))}
    </div>
  );
}

