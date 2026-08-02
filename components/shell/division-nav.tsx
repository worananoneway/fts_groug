"use client";

import { ClipboardList, FolderKanban, Layers, LayoutDashboard } from "lucide-react";

import { LinkTabs } from "../ui/tabs";
import { DIVISION_NAV } from "@/constants/division";
import type { DivisionNavKey } from "@/types/division";

const navIcons: Partial<Record<DivisionNavKey, typeof ClipboardList>> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  po: ClipboardList,
  cutting: Layers,
};

export function DivisionNav({ active }: { active: DivisionNavKey }) {
  return (
    <LinkTabs<DivisionNavKey>
      items={DIVISION_NAV.map((item) => ({ ...item, icon: navIcons[item.key] }))}
      value={active}
    />
  );
}
