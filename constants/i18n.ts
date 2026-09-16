// พจนานุกรมสองภาษา (ไทย/อังกฤษ) — เพิ่ม key ใหม่ได้ที่นี่ แล้วเรียกด้วย useT()
export type Lang = "th" | "en";

export const DICT: Record<string, { th: string; en: string }> = {
  // เมนู
  "nav.dashboard": { th: "แดชบอร์ด", en: "Dashboard" },
  "nav.po": { th: "ใบสั่งซื้อ PO", en: "Purchase Orders" },
  "nav.projects": { th: "โปรเจค", en: "Projects" },
  "nav.cutting": { th: "งานตัด", en: "Cutting" },

  // header
  "header.masterData": { th: "ข้อมูลหลัก", en: "Master Data" },
  "header.statusLoading": { th: "กำลังโหลดข้อมูล", en: "Loading data" },
  "header.statusOk": { th: "เชื่อมต่อข้อมูลจริง", en: "Live data connected" },
  "header.statusFail": { th: "เชื่อมต่อข้อมูลไม่สำเร็จ", en: "Connection failed" },

  // dashboard
  "dash.title": { th: "ภาพรวมสต็อกเหล็ก", en: "Steel Stock Overview" },
  "dash.subtitle": { th: "สรุปจำนวนเหล็กคงเหลือและงานตัด · ดึงสดจาก Express", en: "Steel on hand & cutting jobs · live from Express" },
  "dash.totalStock": { th: "รวมสต็อกเหล็กในคลัง (เพลา + แผ่น)", en: "Total steel in stock (bars + plates)" },
  "dash.roundBars": { th: "เพลาเหล็กกลม", en: "Round Bars" },
  "dash.plates": { th: "เหล็กแผ่น", en: "Steel Plates" },
  "dash.scrap": { th: "เศษเหล็กในคลัง", en: "Scrap in Stock" },
  "dash.jp": { th: "ใบสั่งตัด", en: "Cutting Orders" },
  "dash.fromExpress": { th: "จาก Express", en: "from Express" },
  "dash.latest": { th: "รายการล่าสุด", en: "latest" },
  "dash.remainingUnit": { th: "คงเหลือ", en: "remaining" },
  "dash.codesUnit": { th: "รหัส", en: "codes" },
  "dash.composition": { th: "สัดส่วนสต็อกเหล็ก", en: "Stock Composition" },
  "dash.total": { th: "รวม", en: "Total" },
  "dash.byDiameter": { th: "เพลาเหล็กกลม — แยกตามขนาด Ø", en: "Round Bars — by diameter Ø" },
  "dash.byThickness": { th: "เหล็กแผ่น — แยกตามความหนา", en: "Plates — by thickness" },
  "dash.emptyBars": { th: "ยังไม่มีข้อมูลสต็อกเพลา", en: "No round-bar stock yet" },
  "dash.emptyPlates": { th: "ยังไม่มีข้อมูลสต็อกแผ่น", en: "No plate stock yet" },
  "dash.clickHint": { th: "คลิกแถวในกราฟเพื่อดูรายการเหล็กแต่ละรหัส · ข้อมูลอัปเดตทุกครั้งที่เปิดหน้านี้", en: "Click a bar to see items by code · refreshed each time you open this page" },
  "dash.refresh": { th: "รีเฟรช", en: "Refresh" },
  "dash.updatedAt": { th: "อัปเดตเมื่อ", en: "Updated" },
  "dash.share": { th: "สัดส่วน", en: "share" },
  "dash.recentJp": { th: "ใบสั่งตัดล่าสุดจาก Express", en: "Latest cutting orders from Express" },
  "dash.pieces": { th: "ชิ้น", en: "pcs" },
  "dash.topN": { th: "8 อันดับแรก", en: "top 8" },
  "dash.noJp": { th: "ยังไม่มีใบสั่งตัดจาก Express", en: "No cutting orders from Express yet" },
  "dash.unknownSize": { th: "ไม่ระบุขนาด", en: "Size not specified" },
  "dash.poStatus": { th: "สถานะงานตัดในใบสั่งซื้อ", en: "Cutting jobs by PO status" },
  "dash.todo": { th: "สิ่งที่ต้องดำเนินการ", en: "Needs attention" },
  "dash.jpTrend": { th: "ใบสั่งตัด 7 วันล่าสุด", en: "Cutting orders · last 7 days" },
  "dash.openPo": { th: "เปิดหน้าใบสั่งซื้อ", en: "Open purchase orders" },
  "dash.scrapNoLocation": { th: "เศษที่ยังไม่กำหนดที่เก็บ", en: "Scrap without a storage location" },
  "dash.scrapScheduled": { th: "เศษที่กำหนดวัน-เวลาไว้แล้ว", en: "Scrap with a scheduled date" },
  "dash.stockWithLocation": { th: "สต็อกที่ระบุที่จัดเก็บแล้ว", en: "Stock codes with a location" },
  "dash.jpNotImported": { th: "ใบสั่งตัดจาก Express (รอเปิดงาน)", en: "Cutting orders from Express (to start)" },
  "dash.allClear": { th: "ไม่มีรายการค้าง — เรียบร้อยทั้งหมด", en: "Nothing pending — all clear" },
  "dash.items": { th: "รายการ", en: "items" },
  "dash.pieHint": { th: "คลิกที่ชิ้นส่วนหรือรายการด้านล่างเพื่อดูรายละเอียด", en: "Click a slice or a legend row for details" },
  "dash.detailCode": { th: "รหัสสินค้า", en: "Product Code" },
  "dash.detailSize": { th: "ขนาด", en: "Size" },
  "dash.detailRemain": { th: "คงเหลือ", en: "Remaining" },
};

export function translate(lang: Lang, key: string): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.th;
}
