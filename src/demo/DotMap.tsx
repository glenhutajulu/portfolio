import { useEffect, useMemo, useRef, useState } from 'react';
import { REGIONS, type Site, fmt } from './data';
import { toneColor, type Tone } from './lenses';

const X_SPAN = 0.97;
const Y_SPAN = 0.62;

interface Props {
  sites: Site[];
  active: Site[];
  tone: Tone;
  regionId: number | null;
  hoverRegion?: number | null;
  onRegion?: (id: number) => void;
  onHoverRegion?: (id: number | null) => void;
  label: string;
}

type Rgb = [number, number, number];

function plot(data: Uint8ClampedArray, w: number, h: number, x: number, y: number, size: number, [r, g, b]: Rgb, a: number) {
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= w || py >= h) continue;
      const i = (py * w + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }
}

export function DotMap({ sites, active, tone, regionId, hoverRegion = null, onRegion, onHoverRegion, label }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLCanvasElement>(null);
  const top = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ w: Math.round(entry.contentRect.width), h: Math.round(entry.contentRect.height) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const focus = hoverRegion ?? regionId;

  useEffect(() => {
    const canvas = base.current;
    if (!canvas || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(size.w * dpr);
    const h = Math.round(size.h * dpr);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(w, h);
    const dot = dpr > 1 ? 2 : 1;
    for (const site of sites) {
      const alpha = focus === null ? 150 : site.region === focus ? 190 : 50;
      plot(image.data, w, h, Math.round((site.x / X_SPAN) * w), Math.round((site.y / Y_SPAN) * h), dot, [113, 113, 122], alpha);
    }
    ctx.putImageData(image, 0, 0);
  }, [sites, size, focus]);

  useEffect(() => {
    const canvas = top.current;
    if (!canvas || !size.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(size.w * dpr);
    const h = Math.round(size.h * dpr);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(w, h);
    const sparse = active.length < 12000;
    const dot = dpr > 1 ? (sparse ? 3 : 2) : sparse ? 2 : 1;
    const colour = toneColor[tone];
    for (const site of active) {
      const dimmed = focus !== null && site.region !== focus;
      plot(image.data, w, h, Math.round((site.x / X_SPAN) * w), Math.round((site.y / Y_SPAN) * h), dot, colour, dimmed ? 60 : 255);
    }
    ctx.putImageData(image, 0, 0);
    canvas.getAnimations().forEach((a) => a.cancel());
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.animate([{ opacity: 0.15 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    }
  }, [active, tone, size, focus]);

  const pins = useMemo(() => {
    const counts = new Array(REGIONS.length).fill(0);
    for (const site of active) counts[site.region]++;
    return REGIONS.map((region) => {
      const mid = region.spine[1];
      return { region, count: counts[region.id], left: (mid[0] / X_SPAN) * 100, top: (mid[1] / Y_SPAN) * 100 };
    });
  }, [active]);

  return (
    <div className="vw-map" ref={wrap}>
      <canvas ref={base} role="img" aria-label={label} />
      <canvas ref={top} aria-hidden="true" />
      {onRegion &&
        pins.map(({ region, count, left, top: y }) => (
          <button
            key={region.id}
            type="button"
            className="vw-pin"
            data-active={focus === region.id || undefined}
            style={{ left: `${left}%`, top: `${y}%` }}
            onClick={() => onRegion(region.id)}
            onPointerEnter={() => onHoverRegion?.(region.id)}
            onPointerLeave={() => onHoverRegion?.(null)}
            aria-pressed={regionId === region.id}
            aria-label={`${region.name}, ${fmt.int(count)} sites`}
          >
            <span>{fmt.int(count)}</span>
            <em>{region.name}</em>
          </button>
        ))}
    </div>
  );
}
