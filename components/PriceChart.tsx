"use client";

import { useMemo, useState } from "react";
import type { HistoryPoint } from "@/lib/types";
import { fmtDate, money } from "@/lib/format";

const W = 860;
const H = 260;
const PAD = { l: 64, r: 20, t: 18, b: 34 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

interface Coord {
  px: number;
  py: number;
  price: number;
  date: string;
}

interface Hover {
  point: Coord;
  x: number;
  y: number;
}

/** Gráfica SVG del histórico de precio (port del drawChart original, sin dependencias). */
export default function PriceChart({ history }: { history: HistoryPoint[] }) {
  const [hover, setHover] = useState<Hover | null>(null);

  const { coords, gridY, linePath, areaPath } = useMemo(() => {
    const pts = history.filter((h): h is HistoryPoint & { price: number } => h.price != null);

    const times = pts.map((p) => new Date(p.captured_at).getTime());
    const prices = pts.map((p) => p.price);
    let tMin = Math.min(...times);
    let tMax = Math.max(...times);
    if (tMin === tMax) {
      tMin -= 86400000;
      tMax += 86400000;
    }
    let pMin = Math.min(...prices);
    let pMax = Math.max(...prices);
    if (pMin === pMax) {
      pMin *= 0.95;
      pMax *= 1.05;
    }
    const padP = (pMax - pMin) * 0.12;
    pMin -= padP;
    pMax += padP;

    const x = (t: number) => PAD.l + ((t - tMin) / (tMax - tMin)) * IW;
    const y = (p: number) => PAD.t + (1 - (p - pMin) / (pMax - pMin)) * IH;

    const coords: Coord[] = pts.map((p) => ({
      px: x(new Date(p.captured_at).getTime()),
      py: y(p.price),
      price: p.price,
      date: p.captured_at,
    }));

    // 4 líneas de guía en Y con su etiqueta en colones.
    const ticks = 4;
    const gridY = Array.from({ length: ticks + 1 }, (_, i) => {
      const val = pMin + ((pMax - pMin) * i) / ticks;
      return { y: y(val), label: money(Math.round(val)) };
    });

    const linePath = coords.map((c, i) => `${i ? "L" : "M"}${c.px},${c.py}`).join(" ");
    const areaPath =
      coords.length > 1
        ? `M${coords[0].px},${H - PAD.b} ` +
          coords.map((c) => `L${c.px},${c.py}`).join(" ") +
          ` L${coords[coords.length - 1].px},${H - PAD.b} Z`
        : "";

    return { coords, gridY, linePath, areaPath };
  }, [history]);

  if (coords.length === 0) return null;

  const first = coords[0];
  const last = coords[coords.length - 1];

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = W / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    let best = coords[0];
    let bd = Infinity;
    for (const c of coords) {
      const d = Math.abs(c.px - mx);
      if (d < bd) {
        bd = d;
        best = c;
      }
    }
    setHover({
      point: best,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full rounded-[10px] border border-line bg-white"
      >
        {gridY.map((g, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={g.y} x2={W - PAD.r} y2={g.y} stroke="#e9e9e9" strokeWidth={1} />
            <text x={PAD.l - 8} y={g.y + 4} textAnchor="end" fill="#999" fontSize={11}>
              {g.label}
            </text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill="rgba(228,35,39,0.1)" />}
        <path d={linePath} fill="none" stroke="#e42327" strokeWidth={2} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.px} cy={c.py} r={3.5} fill="#e42327" />
        ))}
        <text x={first.px} y={H - 12} textAnchor="middle" fill="#999" fontSize={11}>
          {fmtDate(first.date)}
        </text>
        {coords.length > 1 && (
          <text x={last.px} y={H - 12} textAnchor="middle" fill="#999" fontSize={11}>
            {fmtDate(last.date)}
          </text>
        )}
        {hover && (
          <circle
            cx={hover.point.px}
            cy={hover.point.py}
            r={5}
            fill="#fff"
            stroke="#e42327"
            strokeWidth={2}
          />
        )}
        <rect
          x={PAD.l}
          y={PAD.t}
          width={IW}
          height={IH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] whitespace-nowrap rounded-lg bg-black px-[10px] py-[6px] text-xs text-white"
          style={{ left: hover.x, top: hover.y }}
        >
          <b>{money(hover.point.price)}</b>
          <br />
          {fmtDate(hover.point.date)}
        </div>
      )}
    </div>
  );
}
