import type { Metadata } from "next";

import { WastrelSteelRoundBarsScreen } from "@/components/master-data/wastrel-steel-round-bars-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data - เศษเพลาเหล็กกลม",
  description: "คลังเศษเพลาเหล็กกลมจากงานตัด | Wastrel Steel Round Bars",
};

export default function WastrelSteelRoundBarsMasterDataPage() {
  return <WastrelSteelRoundBarsScreen />;
}
