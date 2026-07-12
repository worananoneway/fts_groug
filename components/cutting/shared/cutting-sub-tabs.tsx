"use client";

import { Recycle, Ruler, Settings } from "lucide-react";

import { Tabs } from "../../ui/tabs";
import { SUB_TABS } from "@/constants/division";
import { useCuttingContext } from "../cutting-provider";
import type { SubTabKey } from "@/types/division";

const subTabIcons = {
  settings: Settings,
  layout: Ruler,
  scrap: Recycle,
};

export function CuttingSubTabs() {
  const { module, plateTab, roundTab, setPlateTab, setRoundTab } = useCuttingContext();
  const activeTab = module === "plate" ? plateTab : roundTab;
  const setActiveTab = module === "plate" ? setPlateTab : setRoundTab;

  return (
    <Tabs<SubTabKey>
      items={SUB_TABS.map((item) => ({ ...item, icon: subTabIcons[item.key] }))}
      onChange={setActiveTab}
      value={activeTab}
      variant="sub"
    />
  );
}
