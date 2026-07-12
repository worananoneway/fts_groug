"use client";

import { PlateLayoutTab } from "./plate-layout-tab";
import { PlateScrapTab } from "./plate-scrap-tab";
import { PlateSettingsTab } from "./plate-settings-tab";
import { useCutting } from "@/hooks/use-cutting";

export function PlateModule() {
  const { plateTab } = useCutting();

  if (plateTab === "layout") return <PlateLayoutTab />;
  if (plateTab === "scrap") return <PlateScrapTab />;
  return <PlateSettingsTab />;
}

