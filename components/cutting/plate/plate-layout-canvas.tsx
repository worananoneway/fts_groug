import { fmt } from "@/utils/format";
import type { PlateSheet } from "@/types/division";
import type { ReactNode } from "react";

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
  const used = sheet.pieces.reduce((sum, piece) => sum + piece.w * piece.h, 0);
  const utilization = (used / (sheetW * sheetH || 1)) * 100;

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-800">
          แผ่นที่ {sheetNo}
          <span className="ml-2 font-mono text-sm font-normal text-slate-500">
            {fmt(sheetW)} x {fmt(sheetH)} มม.{sourceCode ? ` | ${sourceCode}` : ""}
          </span>
        </h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-bold text-blue-700">
          ใช้พื้นที่ {utilization.toFixed(1)}%
        </span>
      </div>
      {actions ? <div className="mb-4 flex justify-end gap-2">{actions}</div> : null}
      <svg
        aria-label={`แผนผังการตัดแผ่นที่ ${sheetNo}`}
        className="w-full rounded-lg border border-slate-200 bg-slate-50"
        role="img"
        style={{ aspectRatio: `${sheetW} / ${sheetH}` }}
        viewBox={`0 0 ${sheetW} ${sheetH}`}
      >
        {sheet.freeRects.map((rect, index) => (
          <rect
            key={`scrap-${index}`}
            fill="#f0fdf4"
            height={rect.h}
            stroke="#86efac"
            strokeDasharray="12 8"
            strokeWidth={2}
            width={rect.w}
            x={rect.x}
            y={rect.y}
          />
        ))}
        {sheet.pieces.map((piece, index) => {
          const minSide = Math.max(1, Math.min(piece.w, piece.h));
          return (
            <g key={`${piece.code}-${index}`}>
              <title>
                {piece.code} | {fmt(piece.w)} x {fmt(piece.h)} มม.
                {piece.rotated ? " (หมุน)" : ""}
              </title>
              <rect
                fill={piece.color}
                fillOpacity={0.85}
                height={piece.h}
                stroke="#1e293b"
                strokeWidth={2}
                width={piece.w}
                x={piece.x}
                y={piece.y}
              />
              <text
                dominantBaseline="central"
                fill="#fff"
                fontFamily="monospace"
                fontSize={minSide * 0.3}
                fontWeight="bold"
                textAnchor="middle"
                x={piece.x + piece.w / 2}
                y={piece.y + piece.h / 2}
              >
                {piece.code}
              </text>
              <text
                fill="#ffffffcc"
                fontFamily="monospace"
                fontSize={minSide * 0.13}
                textAnchor="middle"
                x={piece.x + piece.w / 2}
                y={piece.y + piece.h / 2 + minSide * 0.28}
              >
                {fmt(piece.w)}x{fmt(piece.h)}
                {piece.rotated ? " R" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}