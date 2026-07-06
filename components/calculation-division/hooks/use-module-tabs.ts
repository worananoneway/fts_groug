"use client";

import { MODULE_TABS, SUB_TABS } from "../constants";
import { useCalculationDivisionContext } from "../calculation-division-provider";

export function useModuleTabs() {
  const context = useCalculationDivisionContext();
  const showSubTabs = context.module === "plate" || context.module === "roundbar";
  const activeSubTab = context.module === "plate" ? context.plateTab : context.roundTab;
  const setActiveSubTab = context.module === "plate" ? context.setPlateTab : context.setRoundTab;

  return {
    moduleTabs: MODULE_TABS,
    activeModule: context.module,
    setActiveModule: context.setModule,
    subTabs: SUB_TABS,
    showSubTabs,
    activeSubTab,
    setActiveSubTab,
  };
}

