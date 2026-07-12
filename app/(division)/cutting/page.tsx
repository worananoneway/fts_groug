import type { Metadata } from "next";

import { CuttingScreen } from "@/components/cutting/cutting-screen";
import type { CuttingType } from "@/types/division";

export const metadata: Metadata = {
  title: "FTS-GROUP | Cutting Division",
  description: "ระบบคำนวณการตัดเหล็กแผ่นและเพลาเหล็กกลม",
};

// หน้าเดียวรวมตัดแผ่น/ตัดเพลา — query params ใช้เป็นค่าตั้งต้นตอนส่งงานมาจากหน้า /po
export default async function CuttingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialType: CuttingType = firstParam(params.type) === "roundbar" ? "roundbar" : "plate";
  return (
    <CuttingScreen
      detailId={firstParam(params.detail)}
      initialType={initialType}
      poId={firstParam(params.po)}
    />
  );
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
