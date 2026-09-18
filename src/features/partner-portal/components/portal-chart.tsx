'use client';

/**
 * The v29 "Biểu đồ tương tác V5" charts, ported from the mockup's
 * `renderLineChart` / `renderBarChart`.
 *
 * Geometry, class names and copy are kept identical to the design file: the
 * 760×284 viewBox, the same padding, five gridlines, the focus line that snaps
 * to the nearest index, and the dark tooltip. Only the plumbing is React — the
 * mockup wrote innerHTML and attached listeners by hand.
 */

import { useCallback, useMemo, useRef, useState } from 'react';

export type ChartSeries = {
  name: string;
  color: string;
  data: number[];
  /** Fill the area under the line with a fade of `color`. */
  area?: boolean;
  dashed?: boolean;
};

export type ChartFormat = 'moneyM' | 'percent' | 'count';

export type ChartConfig = {
  unit: string;
  format: ChartFormat;
  labels: string[];
  series: ChartSeries[];
  /** Pin the axis instead of deriving it from the data. */
  yMax?: number;
  showLegend?: boolean;
};

const W = 760;
const H = 284;
const TICKS = 5;

export function formatChartValue(v: number, format: ChartFormat, axis = false): string {
  if (format === 'moneyM') {
    return axis
      ? `${Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
      : `${Number(v).toLocaleString('vi-VN', {
          minimumFractionDigits: v % 1 ? 1 : 0,
          maximumFractionDigits: 2
        })} triệu đồng`;
  }
  if (format === 'percent') {
    return `${Number(v).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`;
  }
  return Number(v).toLocaleString('vi-VN');
}

/** Round an axis maximum up to 1, 2, 5 or 10 times a power of ten. */
function niceChartMax(value: number): number {
  if (value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

type Hover = {
  index: number;
  seriesIndexes?: number[];
  left: number;
  top: number;
} | null;

function Tooltip({ cfg, hover }: { cfg: ChartConfig; hover: Hover }) {
  if (!hover) return <div className='chart-tooltip' />;
  const indexes = hover.seriesIndexes ?? cfg.series.map((_, i) => i);
  return (
    <div className='chart-tooltip show' style={{ left: `${hover.left}px`, top: `${hover.top}px` }}>
      <div className='chart-tooltip-title'>{cfg.labels[hover.index] ?? ''}</div>
      {indexes.map((si) => {
        const s = cfg.series[si]!;
        return (
          <div className='chart-tooltip-row' key={si}>
            <span>
              <i className='chart-dot' style={{ background: s.color }} />
              {s.name}
            </span>
            <strong>{formatChartValue(s.data[hover.index] ?? 0, cfg.format)}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ cfg }: { cfg: ChartConfig }) {
  if (cfg.showLegend === false) return null;
  return (
    <div className='chart-legend'>
      {cfg.series.map((s) => (
        <span className='chart-legend-item' key={s.name}>
          <i className='chart-legend-swatch' style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export function PortalLineChart({ cfg, ariaLabel }: { cfg: ChartConfig; ariaLabel?: string }) {
  const P = { l: 58, r: 18, t: 24, b: 42 };
  const plotW = W - P.l - P.r;
  const plotH = H - P.t - P.b;
  const n = cfg.labels.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  // One gradient id per mounted chart, so two charts on a page do not collide.
  const uid = useMemo(() => Math.random().toString(36).slice(2, 9), []);

  const max = useMemo(() => {
    const rawMax = Math.max(...cfg.series.flatMap((s) => s.data));
    return cfg.yMax ?? niceChartMax(rawMax * 1.08);
  }, [cfg]);

  const x = useCallback(
    (i: number) => P.l + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1)),
    [P.l, n, plotW]
  );
  const y = useCallback((v: number) => P.t + plotH - (v / max) * plotH, [P.t, plotH, max]);

  const tickIdx = useMemo(() => {
    const raw = [
      0,
      Math.round((n - 1) * 0.25),
      Math.round((n - 1) * 0.5),
      Math.round((n - 1) * 0.75),
      n - 1
    ];
    return raw.filter((v, i, a) => a.indexOf(v) === i);
  }, [n]);

  const activate = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      const stage = stageRef.current;
      if (!svg || !stage) return;
      const rect = svg.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * W;
      let idx = Math.round(((sx - P.l) / plotW) * (n - 1));
      idx = Math.max(0, Math.min(n - 1, idx));

      const stageRect = stage.getBoundingClientRect();
      const px = (x(idx) / W) * stageRect.width;
      const peak = Math.max(...cfg.series.map((s) => s.data[idx] ?? 0));
      setHover({
        index: idx,
        left: Math.max(105, Math.min(stageRect.width - 105, px)),
        top: (y(peak) / H) * stageRect.height
      });
    },
    [P.l, cfg.series, n, plotW, x, y]
  );

  const focusX = hover ? x(hover.index) : 0;

  return (
    <div className='chart'>
      <div className='chart-stage' ref={stageRef}>
        <span className='chart-unit'>Đơn vị: {cfg.unit}</span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role='img'
          aria-label={`Biểu đồ ${ariaLabel ?? ''}`}
          ref={svgRef}
        >
          <defs>
            {cfg.series.map((s, si) => (
              <linearGradient id={`area-${uid}-${si}`} x1='0' y1='0' x2='0' y2='1' key={si}>
                <stop offset='0' stopColor={s.color} stopOpacity='.24' />
                <stop offset='1' stopColor={s.color} stopOpacity='0' />
              </linearGradient>
            ))}
          </defs>

          {Array.from({ length: TICKS + 1 }, (_, i) => {
            const value = (max * (TICKS - i)) / TICKS;
            const yy = P.t + (plotH * i) / TICKS;
            return (
              <g key={i}>
                <line className='gridline' x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
                <text className='chart-axis-label' x={P.l - 10} y={yy + 4} textAnchor='end'>
                  {formatChartValue(value, cfg.format, true)}
                </text>
              </g>
            );
          })}

          <line className='chart-axis' x1={P.l} x2={P.l} y1={P.t} y2={P.t + plotH} />
          <line className='chart-axis' x1={P.l} x2={W - P.r} y1={P.t + plotH} y2={P.t + plotH} />

          {tickIdx.map((i) => (
            <text className='chart-axis-label' x={x(i)} y={H - 13} textAnchor='middle' key={i}>
              {cfg.labels[i]}
            </text>
          ))}

          {cfg.series.map((s, si) => {
            const d = s.data
              .map((v, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
              .join(' ');
            return (
              <g key={si}>
                {s.area && (
                  <path
                    className='chart-series-area'
                    fill={`url(#area-${uid}-${si})`}
                    d={`${d} L ${x(n - 1)} ${P.t + plotH} L ${x(0)} ${P.t + plotH} Z`}
                  />
                )}
                <path
                  className='chart-series-line'
                  stroke={s.color}
                  strokeDasharray={s.dashed ? '8 6' : undefined}
                  d={d}
                />
                {s.data.map((v, i) => (
                  <circle
                    className={`chart-point${hover?.index === i ? ' is-active' : ''}`}
                    cx={x(i)}
                    cy={y(v)}
                    r={3.6}
                    fill={s.color}
                    key={i}
                  />
                ))}
              </g>
            );
          })}

          <line
            className={`chart-focus-line${hover ? ' is-active' : ''}`}
            x1={focusX}
            x2={focusX}
            y1={P.t}
            y2={P.t + plotH}
          />
          <rect
            className='chart-overlay'
            x={P.l}
            y={P.t}
            width={plotW}
            height={plotH}
            fill='transparent'
            style={{ cursor: 'crosshair' }}
            onPointerMove={(e) => activate(e.clientX)}
            onPointerDown={(e) => activate(e.clientX)}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        <Tooltip cfg={cfg} hover={hover} />
      </div>
      <Legend cfg={cfg} />
      <div className='chart-hint'>
        ⓘ Đưa chuột trên đường biểu đồ hoặc chạm vào biểu đồ để hiện giá trị tại từng ngày.
      </div>
    </div>
  );
}

export function PortalBarChart({ cfg, ariaLabel }: { cfg: ChartConfig; ariaLabel?: string }) {
  const P = { l: 58, r: 18, t: 24, b: 52 };
  const plotW = W - P.l - P.r;
  const plotH = H - P.t - P.b;
  const n = cfg.labels.length;
  const sCount = cfg.series.length;

  const stageRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [activeBar, setActiveBar] = useState<string | null>(null);

  const max = useMemo(() => {
    const rawMax = Math.max(...cfg.series.flatMap((s) => s.data));
    return cfg.yMax ?? niceChartMax(rawMax * 1.1);
  }, [cfg]);

  const y = (v: number) => P.t + plotH - (v / max) * plotH;
  const groupW = plotW / n;
  const barW = Math.min(42, (groupW - 20) / sCount);

  const showBar = (event: React.PointerEvent<SVGRectElement>, i: number, si: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const sr = stage.getBoundingClientRect();
    const br = event.currentTarget.getBoundingClientRect();
    setActiveBar(`${i}-${si}`);
    setHover({
      index: i,
      seriesIndexes: [si],
      left: Math.max(105, Math.min(sr.width - 105, br.left - sr.left + br.width / 2)),
      top: Math.max(42, br.top - sr.top)
    });
  };

  return (
    <div className='chart'>
      <div className='chart-stage' ref={stageRef}>
        <span className='chart-unit'>Đơn vị: {cfg.unit}</span>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role='img'
          aria-label={`Biểu đồ ${ariaLabel ?? ''}`}
          onPointerLeave={() => {
            setHover(null);
            setActiveBar(null);
          }}
        >
          {Array.from({ length: TICKS + 1 }, (_, i) => {
            const value = (max * (TICKS - i)) / TICKS;
            const yy = P.t + (plotH * i) / TICKS;
            return (
              <g key={i}>
                <line className='gridline' x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
                <text className='chart-axis-label' x={P.l - 10} y={yy + 4} textAnchor='end'>
                  {formatChartValue(value, cfg.format, true)}
                </text>
              </g>
            );
          })}

          <line className='chart-axis' x1={P.l} x2={P.l} y1={P.t} y2={P.t + plotH} />
          <line className='chart-axis' x1={P.l} x2={W - P.r} y1={P.t + plotH} y2={P.t + plotH} />

          {cfg.labels.map((label, i) => {
            const gx = P.l + i * groupW + groupW / 2;
            return (
              <g key={label}>
                {cfg.series.map((s, si) => {
                  const bx = gx - (sCount * barW + (sCount - 1) * 6) / 2 + si * (barW + 6);
                  const yy = y(s.data[i] ?? 0);
                  return (
                    <rect
                      className={`chart-bar${activeBar === `${i}-${si}` ? ' is-active' : ''}`}
                      x={bx}
                      y={yy}
                      width={barW}
                      height={P.t + plotH - yy}
                      rx={6}
                      fill={s.color}
                      key={si}
                      onPointerEnter={(e) => showBar(e, i, si)}
                      onPointerDown={(e) => showBar(e, i, si)}
                    />
                  );
                })}
                <text className='chart-axis-label' x={gx} y={H - 18} textAnchor='middle'>
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
        <Tooltip cfg={cfg} hover={hover} />
      </div>
      <Legend cfg={cfg} />
      <div className='chart-hint'>ⓘ Rê chuột hoặc chạm vào từng cột để xem số liệu chi tiết.</div>
    </div>
  );
}
