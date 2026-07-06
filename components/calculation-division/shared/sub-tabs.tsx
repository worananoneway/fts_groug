"use client";

import { Recycle, Ruler, Settings } from "lucide-react";

import { Tabs } from "../../ui/tabs";
import { useModuleTabs } from "../hooks/use-module-tabs";
import type { SubTabKey } from "../types";

const subTabIcons = {
  settings: Settings,
  layout: Ruler,
  scrap: Recycle,
};

export function SubTabs() {
  const { activeSubTab, setActiveSubTab, showSubTabs, subTabs } = useModuleTabs();
  if (!showSubTabs) return null;

  return (
    <Tabs<SubTabKey>
      items={subTabs.map((tab) => ({ ...tab, icon: subTabIcons[tab.key] }))}
      onChange={setActiveSubTab}
      value={activeSubTab}
      variant="sub"
    />
  );
}

