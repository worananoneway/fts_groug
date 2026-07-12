import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FTS-GROUP | Master Data",
  description: "ข้อมูลหลักของระบบ — ลูกค้า, เหล็กแผ่น, เพลาเหล็กกลม, เศษเหล็กแผ่น, เศษเพลาเหล็กกลม",
};

export default function MasterDataSettingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
