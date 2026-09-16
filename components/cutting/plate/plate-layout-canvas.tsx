import { fmt, sqm } from "@/utils/format";
import type { PlateSheet } from "@/types/division";
import type { ReactNode } from "react";

// กว้างจริงบนจอโดยประมาณ (px) — ใช้แปลง "ขนาดตัวอักษรบนจอ" ให้เป็นหน่วยของ viewBox
// ถ้ากำหนด fontSize เป็นมิลลิเมตรตรง ๆ ตัวเลขจะเล็กจนอ่านไม่ออกเมื่อแผ่นใหญ่
const SCREEN_W = 900;

export function PlateLayoutCanvas({
  actions,
  sheet,
  sheetH,
  sheetNo,
  sheetW,
  sourceCode,
}: {
  actions?: ReactNode;
  sheet: PlateSheet;
  sheetH: number;
  sheetNo: number;
  sheetW: number;
  sourceCode?: string;
}) {
  const usedArea = sheet.pieces.reduce((sum, piece) => sum + piece.w * piece.h, 0);
  const totalArea = sheetW * sheetH || 1;
  const utilization = (usedArea / totalArea) * 100;
  const scrapArea = Math.max(totalArea - usedArea, 0);
  // 1 px บนจอ ≈ กี่หน่วยใน viewBox
  const unit = sheetW / SCREEN_W;
  const px = (size: number) => size * unit;

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            แผ่นที่ {sheetNo}
            <span className="ml-2 font-mono text-sm font-normal text-slate-500">
              {fmt(sheetW)} × {fmt(sheetH)} มม.{sourceCode ? ` · ${sourceCode}` : ""}
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            ตัด {sheet.pieces.length} ชิ้น · ใช้ {sqm(1, usedArea)} ตร.ม. · เศษ {sqm(1, scrapArea)} ตร.ม.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-bold text-blue-700">
            ใช้พื้นที่ {utilization.toFixed(1)}%
          </span>
          {actions}
        </div>
      </div>

      <svg
        aria-label={`แผนผังการตัดแผ่นที่ ${sheetNo}`}
        className="w-full rounded-lg border border-slate-200 bg-white"
        role="img"
        style={{ aspectRatio: `${sheetW} / ${sheetH}` }}
        viewBox={`0 0 ${sheetW} ${sheetH}`}
      >
        <defs>
          <pattern
            id={`plate-scrap-${sheetNo}`}
            width={px(8)}
            height={px(8)}
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <rect width={px(8)} height={px(8)} fill="#f0fdf4" />
            <line x1="0" y1="0" x2="0" y2={px(8)} stroke="#86efac" strokeWidth={px(3)} />
          </pattern>
        </defs>

        {/* พื้นที่เหลือ = เศษ */}
        {sheet.freeRects.map((rect, index) => {
          const showLabel = rect.w > px(90) && rect.h > px(26);
          return (
            <g key={`scrap-${index}`}>
              <title>
                เศษ {fmt(Math.round(rect.w))} × {fmt(Math.round(rect.h))} มม.
              </title>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                fill={`url(#plate-scrap-${sheetNo})`}
                stroke="#22c55e"
                strokeDasharray={`${px(6)} ${px(4)}`}
                strokeWidth={px(1)}
              />
              {showLabel ? (
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h / 2 + px(4)}
                  textAnchor="middle"
                  fill="#15803d"
                  fontSize={px(12)}
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                >
                  เศษ {fmt(Math.round(rect.w))}×{fmt(Math.round(rect.h))}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* ชิ้นงาน */}
        {sheet.pieces.map((piece, index) => {
          const canLabel = piece.w > px(52) && piece.h > px(34);
          const canSize = piece.w > px(86) && piece.h > px(52);
          return (
            <g key={`${piece.code}-${index}`}>
              <title>
                #{index + 1} {piece.code} · {fmt(piece.w)} × {fmt(piece.h)} มม.
                {piece.rotated ? " (หมุน)" : ""}
              </title>
              <rect
                x={piece.x}
                y={piece.y}
                width={piece.w}
                height={piece.h}
                fill={piece.color}
                fillOpacity={0.9}
                stroke="#1e293b"
                strokeWidth={px(1)}
              />
              {canLabel ? (
                <text
                  x={piece.x + piece.w / 2}
                  y={piece.y + piece.h / 2 + (canSize ? -px(2) : px(5))}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={px(14)}
                  fontWeight="700"
                  fontFamily="ui-monospace, monospace"
                >
                  {index + 1}
                </text>
              ) : null}
              {canSize ? (
                <text
                  x={piece.x + piece.w / 2}
                  y={piece.y + piece.h / 2 + px(15)}
                  textAnchor="middle"
                  fill="#ffffffe6"
                  fontSize={px(11)}
                  fontFamily="ui-monospace, monospace"
                >
                  {fmt(piece.w)}×{fmt(piece.h)}
                  {piece.rotated ? " ⟳" : ""}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* กรอบแผ่น + ขนาดแผ่น */}
        <rect x="0" y="0" width={sheetW} height={sheetH} fill="none" stroke="#94a3b8" strokeWidth={px(1.5)} />
        <text x={sheetW / 2} y={px(15)} textAnchor="middle" fill="#64748b" fontSize={px(12)} fontFamily="ui-monospace, monospace">
          ↔ {fmt(sheetW)} มม.
        </text>
        <text
          x={px(15)}
          y={sheetH / 2}
          textAnchor="middle"
          fill="#64748b"
          fontSize={px(12)}
          fontFamily="ui-monospace, monospace"
          transform={`rotate(-90 ${px(15)} ${sheetH / 2})`}
        >
          ↔ {fmt(sheetH)} มม.
        </text>
      </svg>

      {/* ตารางสรุป — อ่านตัวเลขได้ชัดกว่าอ่านจากภาพ */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="w-10 px-2 py-2 font-semibold">#</th>
              <th className="px-2 py-2 font-semibold">รหัสชิ้นงาน</th>
              <th className="px-2 py-2 text-right font-semibold">กว้าง × ยาว (มม.)</th>
              <th className="px-2 py-2 text-right font-semibold">ตำแหน่ง X, Y (มม.)</th>
              <th className="px-2 py-2 text-center font-semibold">หมุน</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {sheet.pieces.map((piece, index) => (
              <tr key={`row-${piece.code}-${index}`} className="border-b border-slate-100">
                <td className="px-2 py-1.5">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[11px] font-bold text-white"
                    style={{ backgroundColor: piece.color }}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="px-2 py-1.5 font-mono text-xs">{piece.code}</td>
                <td className="px-2 py-1.5 text-right font-mono">
                  {fmt(piece.w)} × {fmt(piece.h)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-xs text-slate-500">
                  {fmt(Math.round(piece.x))}, {fmt(Math.round(piece.y))}
                </td>
                <td className="px-2 py-1.5 text-center text-xs">{piece.rotated ? "⟳" : "—"}</td>
              </tr>
            ))}
            <tr className="bg-emerald-50/60">
              <td className="px-2 py-1.5" />
              <td className="px-2 py-1.5 text-xs font-semibold text-emerald-700">
                เศษที่เหลือ ({sheet.freeRects.length} ชิ้น)
              </td>
              <td className="px-2 py-1.5 text-right font-mono font-bold text-emerald-700" colSpan={3}>
                {sqm(1, scrapArea)} ตร.ม.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
