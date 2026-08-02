import type { Metadata } from "next";

import { DashboardScreen } from "@/components/dashboard/dashboard-screen";

export const metadata: Metadata = {
  title: "FTS-GROUP | แดชบอร์ด",
  description: "สรุปภาพรวมสต็อกเหล็กและงานตัด",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}
