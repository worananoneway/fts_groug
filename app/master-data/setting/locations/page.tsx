import type { Metadata } from "next";

import { LocationsScreen } from "@/components/master-data/locations-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data - ที่จัดเก็บ",
  description: "ข้อมูลหลักที่จัดเก็บ (คลัง / โซน / ชั้นวาง) | Storage Locations",
};

export default function LocationsMasterDataPage() {
  return <LocationsScreen />;
}
