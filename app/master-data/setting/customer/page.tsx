import type { Metadata } from "next";

import { CustomerScreen } from "@/components/master-data/customer-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data - ลูกค้า",
  description: "ข้อมูลหลักลูกค้า | Customers",
};

export default function CustomerMasterDataPage() {
  return <CustomerScreen />;
}
