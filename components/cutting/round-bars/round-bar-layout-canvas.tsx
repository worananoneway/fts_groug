import { fmt } from "@/utils/format";
import type { RoundBarLayout } from "@/types/division";
import type { ReactNode } from "react";

// วาดในระบบพิกัดกว้าง 1000 หน่วยเสมอ แล้วค่อยย่อ/ขยายตามความกว้างจริงของกล่อง
// (ถ้าใช้ "มิลลิเมตร" เป็นหน่วยของ viewBox ตรง ๆ ตัวหนังสือจะถูกย่อจนอ่านไม่ออก)
const VIEW_W = 1000;
const BAR_Y = 34;
const BAR_H = 46;
const RULER_Y = BAR_Y + BAR_H + 18;
const VIEW_H = RULER_Y + 26;

/** เลือกระยะขีดไม้บรรทัดให้ได้ประมาณ 6-10 ขีด และเป็นเลขกลม ๆ */
function tickStep(totalMm: number): number {
  const raw = totalMm / 8;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  for (const multiple of [1, 2, 2.5, 5, 10]) {
    if (raw <= pow * multiple) return pow * multiple;
  }
  return pow * 10;
}

export function RoundBarLayoutCanvas({
  actions,
  bar,
  barDiameter,
  barLength,
  barNo,
  sourceCode,
}: {
  actions?: ReactNode;
  bar: RoundBarLayout;
  barDiameter: number;
  barLength: number;
  barNo: number;
  sourceCode?: string;
}) {
  const total = barLength || 1;
  const utilization = (bar.used / total) * 100;
  const leftover = Math.max(barLength - bar.used, 0);
  const toX = (mm: number) => (mm / total) * VIEW_W; // มม. → หน่วยในภาพ
  const step = tickStep(total);
  const ticks: number[] = [];
  for (let mm = 0; mm <= total + 0.5; mm += step) ticks.push(Math.round(mm));
  if (ticks[ticks.length - 1] !== Math.round(total)) ticks.push(Math.round(total));

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">
            แท่งที่ {barNo}
            <span className="ml-2 font-mono text-sm font-normal text-slate-500">
              Ø{fmt(barDiameter)} × {fmt(barLength)} มม.{sourceCode ? ` · ${sourceCode}` : ""}
            </span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            ตัด {bar.pieces.length} ชิ้น · ใช้ไป {fmt(Math.round(bar.used))} มม. · เหลือ{" "}
            {fmt(Math.round(leftover))} มม.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-bold text-blue-700">
            ใช้ความยาว {utilization.toFixed(1)}%
          </span>
          {actions}
        </div>
      </div>

      <svg
        aria-label={`แผนผังการตัดแท่งที่ ${barNo}`}
        className="w-full rounded-lg border border-slate-200 bg-white"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      >
        <defs>
          {/* ลายทแยงสำหรับส่วนที่เป็นเศษ */}
          <pattern id={`scrap-${barNo}`} width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#f0fdf4" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#86efac" strokeWidth="3" />
          </pattern>
        </defs>

        {/* ตัวแท่งเหล็ก */}
        <rect x="0" y={BAR_Y} width={VIEW_W} height={BAR_H} rx="6" fill="#f1f5f9" stroke="#cbd5e1" />

        {bar.pieces.map((piece, index) => {
          const x = toX(piece.start);
          const w = Math.max(toX(piece.length), 1);
          const cx = x + w / 2;
          const showLabel = w >= 34; // แคบกว่านี้ตัวเลขจะทับกัน — ไปดูในตารางด้านล่างแทน
          return (
            <g key={`${piece.code}-${index}`}>
              <title>
                #{index + 1} {piece.code} · {fmt(piece.length)} มม. ({fmt(Math.round(piece.start))}–
                {fmt(Math.round(piece.start + piece.length))})
              </title>
              <rect x={x} y={BAR_Y} width={w} height={BAR_H} fill={piece.color} fillOpacity={0.9} stroke="#1e293b" strokeWidth="1" />
              {showLabel ? (
                <>
                  <text x={cx} y={BAR_Y + 19} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="ui-monospace, monospace">
                    {index + 1}
                  </text>
                  <text x={cx} y={BAR_Y + 36} textAnchor="middle" fill="#ffffffe6" fontSize="12" fontFamily="ui-monospace, monospace">
                    {fmt(piece.length)}
                  </text>
                </>
              ) : (
                <text x={cx} y={BAR_Y - 6} textAnchor="middle" fill="#334155" fontSize="11" fontWeight="700" fontFamily="ui-monospace, monospace">
                  {index + 1}
                </text>
              )}
            </g>
          );
        })}

        {/* ส่วนที่เหลือ = เศษ */}
        {leftover > 0 ? (
          <g>
            <title>เศษเหลือ {fmt(Math.round(leftover))} มม.</title>
            <rect
              x={toX(bar.used)}
              y={BAR_Y}
              width={Math.max(toX(leftover), 1)}
              height={BAR_H}
              fill={`url(#scrap-${barNo})`}
              stroke="#22c55e"
              strokeDasharray="6 4"
            />
            {toX(leftover) >= 60 ? (
              <text
                x={toX(bar.used) + toX(leftover) / 2}
                y={BAR_Y + BAR_H / 2 + 4}
                textAnchor="middle"
                fill="#15803d"
                fontSize="12"
                fontWeight="700"
                fontFamily="ui-monospace, monospace"
              >
                เศษ {fmt(Math.round(leftover))}
              </text>
            ) : null}
          </g>
        ) : null}

        {/* ไม้บรรทัดบอกระยะ */}
        <line x1="0" y1={RULER_Y} x2={VIEW_W} y2={RULER_Y} stroke="#94a3b8" strokeWidth="1" />
        {ticks.map((mm) => {
          const x = Math.min(toX(mm), VIEW_W);
          const anchor = mm === 0 ? "start" : x >= VIEW_W - 1 ? "end" : "middle";
          return (
            <g key={`tick-${mm}`}>
              <line x1={x} y1={RULER_Y - 5} x2={x} y2={RULER_Y + 5} stroke="#94a3b8" strokeWidth="1" />
              <text x={x} y={RULER_Y + 18} textAnchor={anchor} fill="#64748b" fontSize="11" fontFamily="ui-monospace, monospace">
                {fmt(mm)}
              </text>
            </g>
          );
        })}
        <text x={VIEW_W} y={BAR_Y - 8} textAnchor="end" fill="#94a3b8" fontSize="11">
          หน่วย: มิลลิเมตร
        </text>
      </svg>

      {/* ตารางสรุป — อ่านตัวเลขได้ชัดกว่าอ่านจากภาพ */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-500">
              <th className="w-10 px-2 py-2 font-semibold">#</th>
              <th className="px-2 py-2 font-semibold">รหัสชิ้นงาน</th>
              <th className="px-2 py-2 text-right font-semibold">ความยาว (มม.)</th>
              <th className="px-2 py-2 text-right font-semibold">ช่วงที่ตัด (มม.)</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {bar.pieces.map((piece, index) => (
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
                <td className="px-2 py-1.5 text-right font-mono">{fmt(piece.length)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-xs text-slate-500">
                  {fmt(Math.round(piece.start))} – {fmt(Math.round(piece.start + piece.length))}
                </td>
              </tr>
            ))}
            <tr className="bg-emerald-50/60">
              <td className="px-2 py-1.5" />
              <td className="px-2 py-1.5 text-xs font-semibold text-emerald-700">เศษเหลือ</td>
              <td className="px-2 py-1.5 text-right font-mono font-bold text-emerald-700">
                {fmt(Math.round(leftover))}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-xs text-emerald-700">
                {fmt(Math.round(bar.used))} – {fmt(Math.round(barLength))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
