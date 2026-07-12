import type { Metadata } from "next";

import { WastrelMsPlatesScreen } from "@/components/master-data/wastrel-ms-plates-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data - เศษเหล็กแผ่น",
  description: "คลังเศษเหล็กแผ่นจากงานตัด | Wastrel MS Plates",
};

export default function WastrelMsPlatesMasterDataPage() {
  return <WastrelMsPlatesScreen />;
}
