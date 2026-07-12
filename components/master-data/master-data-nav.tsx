"use client";

import { Circle, Recycle, RotateCcw, Square, Users } from "lucide-react";

import { LinkTabs } from "../ui/tabs";
import { MASTER_DATA_NAV } from "@/constants/master-data";
import type { MasterDataNavKey } from "@/types/master-data";

const navIcons = {
  customer: Users,
  ms_plates: Square,
  steel_round_bars: Circle,
  wastrel_ms_plates: Recycle,
  wastrel_steel_round_bars: RotateCcw,
};

export function MasterDataNav({
  active,
  variant = "sub",
}: {
  active: MasterDataNavKey;
  variant?: "header" | "sub";
}) {
  return (
    <LinkTabs<MasterDataNavKey>
      items={MASTER_DATA_NAV.map((item) => ({ ...item, icon: navIcons[item.key] }))}
      value={active}
      variant={variant}
    />
  );
}
