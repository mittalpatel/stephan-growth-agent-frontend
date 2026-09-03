'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import { t } from '@/locales';

const TREND = [
  { day: 'Aug 1', pipeline: 2400 },
  { day: 'Aug 4', pipeline: 4100 },
  { day: 'Aug 7', pipeline: 6800 },
  { day: 'Aug 10', pipeline: 9600 },
  { day: 'Aug 13', pipeline: 11200 },
  { day: 'Aug 16', pipeline: 13400 },
  { day: 'Aug 19', pipeline: 15100 },
  { day: 'Aug 22', pipeline: 16900 },
  { day: 'Aug 25', pipeline: 17800 },
  { day: 'Aug 27', pipeline: 18420 },
] as const;

const RANGES = [
  { key: '7d', label: t.dashboard.businessValue.range7d },
  { key: '30d', label: t.dashboard.businessValue.range30d },
  { key: '90d', label: t.dashboard.businessValue.range90d },
] as const;

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 44;
const PAD_BOTTOM = 20;
const PAD_TOP = 10;

/**
 * A small dependency-free area chart matching `ai-agents-platform`'s
 * `BusinessValueChart` (there built on recharts) — the shape and gridlines
 * are what's being matched, not the charting library.
 */
export function BusinessValueChart() {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30d');
  const data = range === '7d' ? TREND.slice(-3) : TREND;

  const max = Math.max(...data.map((d) => d.pipeline));
  const plotWidth = WIDTH - PAD_LEFT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = PAD_LEFT + i * stepX;
    const y = PAD_TOP + plotHeight - (d.pipeline / max) * plotHeight;
    return { x, y, label: d.day };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + plotHeight} L ${
    points[0].x
  } ${PAD_TOP + plotHeight} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="mb-1 flex items-center justify-end">
        <div className="bg-muted flex items-center rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                range === r.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="mt-2 h-[220px] w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={t.dashboard.businessValue.title}
      >
        <defs>
          <linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridLines.map((g) => {
          const y = PAD_TOP + plotHeight * g;
          const value = Math.round((max * (1 - g)) / 1000);
          return (
            <g key={g}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[10px]"
              >
                ${value}k
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#pipelineGradient)" />
        <path d={linePath} fill="none" className="stroke-primary" strokeWidth={2} />

        {points.map((p) => (
          <text
            key={p.label}
            x={p.x}
            y={HEIGHT - 2}
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
