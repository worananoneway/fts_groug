import type { Metadata } from "next";

import { SteelRoundBarsScreen } from "@/components/master-data/steel-round-bars-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data - เพลาเหล็กกลม",
  description: "ข้อมูลหลักเพลาเหล็กกลม | Steel Round Bars",
};

export default function SteelRoundBarsMasterDataPage() {
  return <SteelRoundBarsScreen />;
}
