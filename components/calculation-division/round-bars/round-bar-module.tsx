"use client";

import { RoundBarLayoutTab } from "./round-bar-layout-tab";
import { RoundBarScrapTab } from "./round-bar-scrap-tab";
import { RoundBarSettingsTab } from "./round-bar-settings-tab";
import { useCalculationDivision } from "../hooks/use-calculation-division";

export function RoundBarModule() {
  const { roundTab } = useCalculationDivision();

  if (roundTab === "layout") return <RoundBarLayoutTab />;
  if (roundTab === "scrap") return <RoundBarScrapTab />;
  return <RoundBarSettingsTab />;
}

