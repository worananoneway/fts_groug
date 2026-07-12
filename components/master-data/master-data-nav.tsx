"use client";

import { LinkTabs } from "../ui/tabs";
import { MASTER_DATA_NAV } from "@/constants/master-data";
import type { MasterDataNavKey } from "@/types/master-data";

export function MasterDataNav({
  active,
  variant = "sub",
}: {
  active: MasterDataNavKey;
  variant?: "header" | "sub";
}) {
  return <LinkTabs<MasterDataNavKey> items={MASTER_DATA_NAV} value={active} variant={variant} />;
}
