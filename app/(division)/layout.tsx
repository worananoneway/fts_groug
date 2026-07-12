import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FTS-GROUP | Factory Cutting Division",
  description: "ระบบงานตัดของโรงงาน — ใบสั่งซื้อ, ตัดแผ่นเหล็ก, ตัดเพลาเหล็กกลม",
};

export default function DivisionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
