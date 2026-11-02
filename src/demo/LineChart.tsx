import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

export interface LineSeries {
  name: string;
  values: number[];
  colour: string;
  dashed?: boolean;
}

interface Props {
  labels: string[];
  series: LineSeries[];
  format: (n: number) => string;
  axisFormat?: (n: number) => string;
  height?: number;
  title: string;
}

function niceTicks(min: number, max: number, count = 4) {
  const span = max - min || 1;
  const raw = span / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(v);
  return ticks;
}

export function LineChart({ labels, series, format, axisFormat = format, height = 240, title }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pad = { top: 12, right: 12, bottom: 26, left: 58 };
  const inner = { w: Math.max(width - pad.left - pad.right, 1), h: height - pad.top - pad.bottom };
  const ticks = useMemo(() => {
    const all = series.flatMap((s) => s.values);
    return niceTicks(Math.min(...all), Math.max(...all));
  }, [series]);
  const low = ticks[0];
  const high = ticks[ticks.length - 1];
  const x = (i: number) => pad.left + (i / (labels.length - 1)) * inner.w;
  const y = (v: number) => pad.top + (1 - (v - low) / (high - low || 1)) * inner.h;

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(ratio * (labels.length - 1)))));
  };

  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') setHover((h) => Math.min((h ?? -1) + 1, labels.length - 1));
    else if (event.key === 'ArrowLeft') setHover((h) => Math.max((h ?? labels.length) - 1, 0));
    else if (event.key === 'Escape') setHover(null);
  };

  const showEvery = width < 420 ? 3 : width < 620 ? 2 : 1;
  const tipLeft = hover === null ? 0 : x(hover);
  const flip = hover !== null && tipLeft > width * 0.62;

  return (
    <div className="vw-chart" ref={wrap} tabIndex={0} role="group" aria-label={`${title}. Use the left and right arrow keys to read each month.`} onKeyDown={onKey} onBlur={() => setHover(null)}>
      <ul className="vw-legend">
        {series.map((s) => (
          <li key={s.name}>
            <svg width="22" height="8" aria-hidden="true">
              <line x1="1" x2="21" y1="4" y2="4" stroke={s.colour} strokeWidth="2" strokeLinecap="round" strokeDasharray={s.dashed ? '3 5' : undefined} />
            </svg>
            {s.name}
          </li>
        ))}
      </ul>
      {width > 0 && (
        <svg width={width} height={height} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#34343A" strokeWidth="1" />
              <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="vw-tick">{axisFormat(t)}</text>
            </g>
          ))}
          {labels.map((label, i) =>
            i % showEvery === (labels.length - 1) % showEvery ? (
              <text key={label} x={x(i)} y={height - 7} textAnchor="middle" className="vw-tick">{label}</text>
            ) : null,
          )}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + inner.h} stroke="#A1A1AA" strokeWidth="1" />}
          {series.map((s) => (
            <polyline
              key={s.name}
              fill="none"
              stroke={s.colour}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={s.dashed ? '3 5' : undefined}
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            />
          ))}
          {hover !== null &&
            series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={s.colour} stroke="#232326" strokeWidth="2" />)}
          <rect
            x={pad.left}
            y={pad.top}
            width={inner.w}
            height={inner.h}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hover !== null && (
        <div className="vw-tip" style={flip ? { right: width - tipLeft + 12 } : { left: tipLeft + 12 }}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <span key={s.name}>
              {s.name}
              <b>{format(s.values[hover])}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
