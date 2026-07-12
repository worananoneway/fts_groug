import type { Metadata } from "next";

import { MsPlatesScreen } from "@/components/master-data/ms-plates-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data - เหล็กแผ่น",
  description: "ข้อมูลหลักเหล็กแผ่น | MS Plates",
};

export default function MsPlatesMasterDataPage() {
  return <MsPlatesScreen />;
}
