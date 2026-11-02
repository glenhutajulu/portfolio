const PATHS = {
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  chart: 'M4 19h16M7 15l4-5 3 3 5-7',
  badge: 'M9 12l2 2 4-4M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z',
  bill: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  spark: 'M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z',
  close: 'M6 6l12 12M18 6 6 18',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M5 20h14',
  check: 'M5 12l5 5 9-10',
  alert: 'M12 4 2.5 20h19zM12 10v4M12 17v.5',
  minus: 'M5 12h14',
  send: 'M5 12h13m0 0-5-5m5 5-5 5',
  back: 'M19 12H6m0 0 5-5m-5 5 5 5',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
