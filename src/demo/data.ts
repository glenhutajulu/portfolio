// Every value here is generated from a fixed seed. Nothing comes from a real
// product, client or network: the regions, sites, codes and amounts are fictional.

export const AS_OF = new Date(Date.UTC(2026, 9, 31));
export const SITE_COUNT = 60000;
export const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

export interface Region {
  id: number;
  code: string;
  name: string;
  share: number;
  fieldRate: number;
  licenseRisk: number;
  spine: [number, number][];
  width: number;
}

export const REGIONS: Region[] = [
  { id: 0, code: 'R01', name: 'North Reach', share: 0.1, fieldRate: 0.05, licenseRisk: 0.8, spine: [[0.13, 0.13], [0.24, 0.07], [0.39, 0.09]], width: 0.03 },
  { id: 1, code: 'R02', name: 'Westgate', share: 0.07, fieldRate: 0.09, licenseRisk: 1.1, spine: [[0.06, 0.22], [0.08, 0.34], [0.13, 0.45]], width: 0.025 },
  { id: 2, code: 'R03', name: 'Ironridge', share: 0.12, fieldRate: 0.15, licenseRisk: 1.5, spine: [[0.16, 0.19], [0.24, 0.24], [0.33, 0.23]], width: 0.04 },
  { id: 3, code: 'R04', name: 'Greenmoor', share: 0.09, fieldRate: 0.04, licenseRisk: 0.6, spine: [[0.38, 0.17], [0.47, 0.15], [0.56, 0.2]], width: 0.036 },
  { id: 4, code: 'R05', name: 'Aster Bay', share: 0.14, fieldRate: 0.08, licenseRisk: 0.9, spine: [[0.19, 0.34], [0.27, 0.39], [0.35, 0.37]], width: 0.036 },
  { id: 5, code: 'R06', name: 'Lowmere', share: 0.13, fieldRate: 0.06, licenseRisk: 0.7, spine: [[0.41, 0.3], [0.48, 0.34], [0.57, 0.33]], width: 0.04 },
  { id: 6, code: 'R07', name: 'Harrow Coast', share: 0.07, fieldRate: 0.12, licenseRisk: 1.3, spine: [[0.27, 0.5], [0.37, 0.5], [0.46, 0.46]], width: 0.026 },
  { id: 7, code: 'R08', name: 'Cape Verity', share: 0.04, fieldRate: 0.11, licenseRisk: 1.8, spine: [[0.5, 0.48], [0.55, 0.53], [0.62, 0.54]], width: 0.018 },
  { id: 8, code: 'R09', name: 'Saltmarsh', share: 0.08, fieldRate: 0.1, licenseRisk: 1, spine: [[0.63, 0.16], [0.68, 0.25], [0.66, 0.36]], width: 0.028 },
  { id: 9, code: 'R10', name: 'Eastfall', share: 0.08, fieldRate: 0.07, licenseRisk: 0.8, spine: [[0.74, 0.1], [0.82, 0.14], [0.87, 0.23]], width: 0.03 },
  { id: 10, code: 'R11', name: 'Sable Point', share: 0.05, fieldRate: 0.13, licenseRisk: 1.4, spine: [[0.76, 0.34], [0.82, 0.39], [0.9, 0.38]], width: 0.022 },
  { id: 11, code: 'R12', name: 'Kestrel Isles', share: 0.03, fieldRate: 0.19, licenseRisk: 2.2, spine: [[0.72, 0.5], [0.8, 0.54], [0.91, 0.52]], width: 0.012 },
];

export type Status = 'normal' | 'field' | 'minimum';
export type LicenseState = 'valid' | 'expiring' | 'expired';
export type BillState = 'paid-soon' | 'due7' | 'overdue';

export interface Site {
  index: number;
  code: string;
  region: number;
  x: number;
  y: number;
  predicted: number;
  actual: number;
  deviation: number;
  status: Status;
  priority: 0 | 1 | 2 | 3 | 4;
  cause: string;
  tariff: number;
  billed: number;
  expectedBill: number;
  licenseNo: string;
  licenseDays: number;
  license: LicenseState;
  billDays: number;
  bill: BillState;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(r: () => number) {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

function pointOnSpine(spine: [number, number][], t: number): [number, number, number, number] {
  const scaled = Math.min(t, 0.9999) * (spine.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const [ax, ay] = spine[i];
  const [bx, by] = spine[i + 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  return [ax + dx * f, ay + dy * f, -dy / len, dx / len];
}

const OVER_CAUSES = ['Cooling unit stuck on', 'Rectifier fault', 'New tenant equipment', 'Generator feeding back to mains'];
const UNDER_CAUSES = ['Grid outage, site on battery', 'Tenant equipment removed', 'Meter under-reading'];
const MINIMUM_CAUSES = ['Site powered down for works', 'Meter not reporting'];

function buildSites(): Site[] {
  const r = rng(20261031);
  const sites: Site[] = [];
  const pad = (n: number, len: number) => String(n).padStart(len, '0');

  REGIONS.forEach((region, regionIndex) => {
    const count =
      regionIndex === REGIONS.length - 1
        ? SITE_COUNT - sites.length
        : Math.round(SITE_COUNT * region.share);
    const towns = Array.from({ length: 9 + Math.floor(r() * 7) }, () => {
      const [x, y, nx, ny] = pointOnSpine(region.spine, r());
      const off = gaussian(r) * region.width * 0.8;
      return { x: x + nx * off, y: y + ny * off, s: 0.004 + r() * 0.011, w: 0.3 + r() };
    });
    const totalWeight = towns.reduce((sum, t) => sum + t.w, 0);

    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      if (r() < 0.6) {
        let pick = r() * totalWeight;
        const town = towns.find((t) => (pick -= t.w) <= 0) ?? towns[0];
        x = town.x + gaussian(r) * town.s;
        y = town.y + gaussian(r) * town.s;
      } else {
        const [sx, sy, nx, ny] = pointOnSpine(region.spine, r());
        const off = gaussian(r) * region.width;
        x = sx + nx * off + gaussian(r) * 0.006;
        y = sy + ny * off + gaussian(r) * 0.006;
      }

      const predicted = Math.round(900 + r() * r() * 3400);
      const tariff = Math.round((0.09 + r() * 0.05) * 1000) / 1000;
      const roll = r();
      let status: Status = 'normal';
      let deviation = gaussian(r) * 0.04;
      let priority: Site['priority'] = 0;
      let cause = '';
      let actual: number;
      let billShift = 1;

      if (roll < 0.022) {
        status = 'minimum';
        actual = Math.round(30 + r() * 110);
        deviation = actual / predicted - 1;
        cause = MINIMUM_CAUSES[Math.floor(r() * MINIMUM_CAUSES.length)];
      } else if (roll < 0.022 + region.fieldRate) {
        status = 'field';
        const size = 0.1 + Math.pow(r(), 2.1) * 0.8;
        const over = r() < 0.72;
        deviation = over ? size : -Math.min(size, 0.7);
        actual = Math.round(predicted * (1 + deviation));
        const list = over ? OVER_CAUSES : UNDER_CAUSES;
        cause = list[Math.floor(r() * list.length)];
        const billMoved = r() < 0.55;
        if (size > 0.5) priority = billMoved ? 1 : 2;
        else priority = size > 0.25 ? 3 : 4;
        if (priority === 1) billShift = 1 + r() * 0.2;
      } else {
        deviation = Math.max(-0.098, Math.min(0.098, deviation));
        actual = Math.round(predicted * (1 + deviation));
      }

      const licenseRoll = r();
      const expired = 0.012 * region.licenseRisk;
      const expiring = 0.055 * region.licenseRisk;
      let licenseDays: number;
      let license: LicenseState;
      if (licenseRoll < expired) {
        license = 'expired';
        licenseDays = -Math.ceil(1 + r() * 120);
      } else if (licenseRoll < expired + expiring) {
        license = 'expiring';
        licenseDays = Math.ceil(1 + r() * 89);
      } else {
        license = 'valid';
        licenseDays = Math.ceil(90 + r() * 900);
      }

      const billRoll = r();
      let billDays: number;
      let bill: BillState;
      if (billRoll < 0.016 * region.licenseRisk) {
        bill = 'overdue';
        billDays = -Math.ceil(1 + r() * 24);
      } else if (billRoll < 0.2) {
        bill = 'due7';
        billDays = Math.floor(r() * 8);
      } else {
        bill = 'paid-soon';
        billDays = 8 + Math.floor(r() * 23);
      }

      const expectedBill = Math.round(predicted * tariff);
      sites.push({
        index: sites.length,
        code: `VW-${pad(region.id + 1, 2)}-${pad(10000 + Math.floor(r() * 89999), 5)}`,
        region: region.id,
        x,
        y,
        predicted,
        actual,
        deviation,
        status,
        priority,
        cause,
        tariff,
        billed: Math.round(actual * tariff * billShift),
        expectedBill,
        licenseNo: `LIC-${pad(100000 + Math.floor(r() * 899999), 6)}`,
        licenseDays,
        license,
        billDays,
        bill,
      });
    }
  });
  return sites;
}

let cache: Site[] | null = null;
export function getSites() {
  return (cache ??= buildSites());
}

const SEASON = [0.97, 0.96, 0.95, 0.97, 1.0, 1.02, 1.05, 1.06, 1.04, 1.03, 1.01, 1];

export interface MonthlyPoint {
  predicted: number;
  actual: number;
}

/** Network or regional totals for the 12 months to the as-of date. */
export function monthlySeries(sites: Site[], metric: 'energy' | 'cost', regionId: number | null): MonthlyPoint[] {
  let predicted = 0;
  let actual = 0;
  for (const site of sites) {
    if (regionId !== null && site.region !== regionId) continue;
    predicted += metric === 'energy' ? site.predicted : site.expectedBill;
    actual += metric === 'energy' ? site.actual : site.billed;
  }
  const r = rng(77 + (regionId ?? 40) * 13 + (metric === 'energy' ? 0 : 5));
  const gap = actual / predicted - 1;
  return SEASON.map((s, i) => {
    if (i === SEASON.length - 1) return { predicted, actual };
    const ramp = 0.35 + (i / SEASON.length) * 0.65;
    const drift = 1 + gap * ramp + (r() - 0.5) * 0.018;
    return { predicted: predicted * s, actual: predicted * s * drift };
  });
}

export function siteSeries(site: Site): MonthlyPoint[] {
  const r = rng(site.index + 11);
  return SEASON.map((s, i) => {
    if (i === SEASON.length - 1) return { predicted: site.predicted, actual: site.actual };
    return { predicted: site.predicted * s, actual: site.predicted * s * (1 + (r() - 0.5) * 0.08) };
  });
}

export function regionName(id: number) {
  return REGIONS[id].name;
}

export function dateFromAsOf(days: number) {
  const date = new Date(AS_OF.getTime() + days * 86400000);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export const fmt = {
  int: (n: number) => Math.round(n).toLocaleString('en-US'),
  pct: (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`,
  signedPct: (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n * 100).toFixed(1)}%`,
  usd: (n: number) => `$${Math.round(n).toLocaleString('en-US')}`,
  compactUsd: (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`),
  mwh: (n: number) => `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 0 })} MWh`,
};
