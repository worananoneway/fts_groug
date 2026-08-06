"use client";

import { ClipboardList, FolderKanban, Layers, LayoutDashboard } from "lucide-react";

import { LinkTabs } from "../ui/tabs";
import { useT } from "../i18n/language-provider";
import { DIVISION_NAV } from "@/constants/division";
import type { DivisionNavKey } from "@/types/division";

const navIcons: Partial<Record<DivisionNavKey, typeof ClipboardList>> = {
  dashboard: LayoutDashboard,
  projects: FolderKanban,
  po: ClipboardList,
  cutting: Layers,
};

export function DivisionNav({ active }: { active: DivisionNavKey }) {
  const t = useT();
  return (
    <LinkTabs<DivisionNavKey>
      items={DIVISION_NAV.map((item) => ({ ...item, label: t(`nav.${item.key}`), icon: navIcons[item.key] }))}
      value={active}
    />
  );
}
