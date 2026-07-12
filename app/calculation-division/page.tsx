import { redirect } from "next/navigation";

// หน้ารวมเดิมถูกแยกเป็น /po และ /cutting — คง path เดิมไว้เป็น redirect กัน bookmark เก่าพัง
export default function CalculationDivisionPage() {
  redirect("/po");
}
