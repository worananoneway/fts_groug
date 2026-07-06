"use client";

import { ClipboardList, Layers, Ruler } from "lucide-react";

import { Tabs } from "../../ui/tabs";
import { useModuleTabs } from "../hooks/use-module-tabs";
import type { ModuleKey } from "../types";

const moduleIcons = {
  po: ClipboardList,
  plate: Layers,
  roundbar: Ruler,
};

export function ModuleTabs() {
  const { activeModule, moduleTabs, setActiveModule } = useModuleTabs();

  return (
    <Tabs<ModuleKey>
      items={moduleTabs.map((tab) => ({ ...tab, icon: moduleIcons[tab.key] }))}
      onChange={setActiveModule}
      value={activeModule}
    />
  );
}

