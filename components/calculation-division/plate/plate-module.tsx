"use client";

import { PlateLayoutTab } from "./plate-layout-tab";
import { PlateScrapTab } from "./plate-scrap-tab";
import { PlateSettingsTab } from "./plate-settings-tab";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function PlateModule() {
  const { plateTab } = useCalculationDivision();

  if (plateTab === "layout") return <PlateLayoutTab />;
  if (plateTab === "scrap") return <PlateScrapTab />;
  return <PlateSettingsTab />;
}

