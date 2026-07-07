import { fmt } from "../mappers";
import type { RoundBarLayout } from "../types";
import type { ReactNode } from "react";

export function RoundBarLayoutCanvas({
  actions,
  bar,
  barDiameter,
  barLength,
  barNo,
}: {
  actions?: ReactNode;
  bar: RoundBarLayout;
  barDiameter: number;
  barLength: number;
  barNo: number;
}) {
  const utilization = (bar.used / (barLength || 1)) * 100;
  const leftover = Math.max(barLength - bar.used, 0);

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-800">
          แท่งที่ {barNo}
          <span className="ml-2 font-mono text-sm font-normal text-slate-500">
            Ø{fmt(barDiameter)} x {fmt(barLength)} มม.
          </span>
        </h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 font-mono text-sm font-bold text-blue-700">
          ใช้ความยาว {utilization.toFixed(1)}%
        </span>
      </div>
      {actions ? <div className="mb-4 flex justify-end gap-2">{actions}</div> : null}
      <svg
        aria-label={`แผนผังการตัดแท่งที่ ${barNo}`}
        className="h-36 w-full rounded-lg border border-slate-200 bg-slate-50"
        role="img"
        viewBox={`0 0 ${barLength} 200`}
      >
        <rect fill="#e2e8f0" height="72" rx="26" width={barLength} x="0" y="64" />
        {bar.pieces.map((piece, index) => {
          const fontSize = Math.min(piece.length * 0.18, 26);
          return (
            <g key={`${piece.code}-${index}`}>
              <title>
                {piece.code} | {fmt(piece.length)} มม.
              </title>
              <rect
                fill={piece.color}
                fillOpacity={0.88}
                height="72"
                stroke="#1e293b"
                strokeWidth={2}
                width={piece.length}
                x={piece.start}
                y="64"
              />
              <text
                dominantBaseline="central"
                fill="#fff"
                fontFamily="monospace"
                fontSize={fontSize}
                fontWeight="bold"
                textAnchor="middle"
                x={piece.start + piece.length / 2}
                y="102"
              >
                {piece.code}
              </text>
              <text
                fill="#ffffffcc"
                fontFamily="monospace"
                fontSize={Math.min(piece.length * 0.08, 14)}
                textAnchor="middle"
                x={piece.start + piece.length / 2}
                y="128"
              >
                {fmt(piece.length)}
              </text>
            </g>
          );
        })}
        {leftover > 0 ? (
          <g>
            <rect
              fill={leftover >= 1 ? "#f0fdf4" : "#f8fafc"}
              height="72"
              stroke={leftover >= 1 ? "#86efac" : "#cbd5e1"}
              strokeDasharray="12 8"
              strokeWidth={2}
              width={leftover}
              x={bar.used}
              y="64"
            />
            <text
              fill="#166534"
              fontFamily="monospace"
              fontSize={Math.min(leftover * 0.08, 16)}
              fontWeight="bold"
              textAnchor="middle"
              x={bar.used + leftover / 2}
              y="158"
            >
              {fmt(Math.floor(leftover))} มม.
            </text>
          </g>
        ) : null}
      </svg>
    </section>
  );
}

