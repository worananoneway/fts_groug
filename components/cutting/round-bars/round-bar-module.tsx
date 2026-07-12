"use client";

import { RoundBarLayoutTab } from "./round-bar-layout-tab";
import { RoundBarScrapTab } from "./round-bar-scrap-tab";
import { RoundBarSettingsTab } from "./round-bar-settings-tab";
import { useCutting } from "@/hooks/use-cutting";

export function RoundBarModule() {
  const { roundTab } = useCutting();

  if (roundTab === "layout") return <RoundBarLayoutTab />;
  if (roundTab === "scrap") return <RoundBarScrapTab />;
  return <RoundBarSettingsTab />;
}

