import { type Site, REGIONS, dateFromAsOf, fmt } from './data';

export type LensId = 'anomalies' | 'licenses' | 'bills';
export type Tone = 'ok' | 'alert' | 'neutral';

export interface SubFilter {
  id: string;
  label: string;
  match: (site: Site) => boolean;
  note: string;
}

export interface Bucket {
  id: string;
  label: string;
  rule: string;
  tone: Tone;
  match: (site: Site) => boolean;
  subFilters?: SubFilter[];
  banner: string;
  rank: (a: Site, b: Site) => number;
}

export interface Column {
  label: string;
  numeric?: boolean;
  render: (site: Site) => string;
  badge?: (site: Site) => Tone | null;
}

export interface Lens {
  id: LensId;
  title: string;
  intro: string;
  defaultBucket: string;
  buckets: Bucket[];
  columns: Column[];
  summary: (sites: Site[], bucket: Bucket, regionId: number | null) => string;
}

const regionColumn: Column = { label: 'Region', render: (s) => REGIONS[s.region].name };

function topRegion(sites: Site[]) {
  const counts = new Array(REGIONS.length).fill(0);
  for (const site of sites) counts[site.region]++;
  const best = counts.indexOf(Math.max(...counts));
  return { region: REGIONS[best], count: counts[best] };
}

function commonCause(sites: Site[]) {
  const counts = new Map<string, number>();
  for (const site of sites) counts.set(site.cause, (counts.get(site.cause) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

const scope = (regionId: number | null) => (regionId === null ? 'the network' : REGIONS[regionId].name);

export const LENSES: Record<LensId, Lens> = {
  anomalies: {
    id: 'anomalies',
    title: 'Anomalies',
    intro: 'October usage against the forecast. Pick a card to filter everything below it.',
    defaultBucket: 'field',
    buckets: [
      {
        id: 'normal',
        label: 'On forecast',
        rule: 'Within 10% of forecast',
        tone: 'ok',
        match: (s) => s.status === 'normal',
        banner: 'These sites used what the model expected. Nothing to do here.',
        rank: (a, b) => Math.abs(b.deviation) - Math.abs(a.deviation),
      },
      {
        id: 'field',
        label: 'Field anomaly',
        rule: 'Over 10% off forecast',
        tone: 'alert',
        match: (s) => s.status === 'field',
        banner: 'Usage moved away from forecast. Send these to the regional team to check on site.',
        rank: (a, b) => a.priority - b.priority || Math.abs(b.deviation) - Math.abs(a.deviation),
        subFilters: [
          { id: 'p1', label: 'P1', match: (s) => s.priority === 1, note: 'Priority 1: over 50% off forecast and the bill moved too. Check these first.' },
          { id: 'p2', label: 'P2', match: (s) => s.priority === 2, note: 'Priority 2: over 50% off forecast, bill unchanged so far.' },
          { id: 'p3', label: 'P3', match: (s) => s.priority === 3, note: 'Priority 3: 25 to 50% off forecast.' },
          { id: 'p4', label: 'P4', match: (s) => s.priority === 4, note: 'Priority 4: 10 to 25% off forecast. Watch for a second month.' },
        ],
      },
      {
        id: 'minimum',
        label: 'Minimum energy',
        rule: 'Under 150 kWh this month',
        tone: 'neutral',
        match: (s) => s.status === 'minimum',
        banner: 'Close to zero usage. Usually a powered-down site or a meter that stopped reporting.',
        rank: (a, b) => a.actual - b.actual,
      },
    ],
    columns: [
      regionColumn,
      { label: 'Forecast kWh', numeric: true, render: (s) => fmt.int(s.predicted) },
      { label: 'Actual kWh', numeric: true, render: (s) => fmt.int(s.actual) },
      { label: 'Off forecast', numeric: true, render: (s) => fmt.signedPct(s.deviation) },
      { label: 'Priority', render: (s) => (s.priority ? `P${s.priority}` : 'None') },
      { label: 'Likely cause', render: (s) => s.cause || 'None' },
    ],
    summary(sites, bucket, regionId) {
      if (!sites.length) return `No sites match this filter in ${scope(regionId)}.`;
      const top = topRegion(sites);
      if (bucket.id === 'field') {
        const extra = sites.reduce((sum, s) => sum + Math.max(0, s.billed - s.expectedBill), 0);
        const lead = regionId === null ? `${top.region.name} leads with ${fmt.int(top.count)} sites. ` : '';
        return `${fmt.int(sites.length)} sites in ${scope(regionId)} ran off forecast in October. ${lead}The most common likely cause is ${commonCause(sites).toLowerCase()}. Bills came in ${fmt.compactUsd(extra)} above forecast.`;
      }
      if (bucket.id === 'minimum') {
        return `${fmt.int(sites.length)} sites in ${scope(regionId)} drew almost no power. The most common reason: ${commonCause(sites).toLowerCase()}.`;
      }
      return `${fmt.int(sites.length)} sites in ${scope(regionId)} stayed within 10% of forecast in October.`;
    },
  },
  licenses: {
    id: 'licenses',
    title: 'Licenses',
    intro: 'Operating licenses per site. Pick a card to see who needs to act.',
    defaultBucket: 'expired',
    buckets: [
      {
        id: 'valid',
        label: 'Valid',
        rule: 'More than 90 days left',
        tone: 'ok',
        match: (s) => s.license === 'valid',
        banner: 'No action needed.',
        rank: (a, b) => a.licenseDays - b.licenseDays,
      },
      {
        id: 'expired',
        label: 'Expired',
        rule: 'Running without a license',
        tone: 'alert',
        match: (s) => s.license === 'expired',
        banner: 'These sites are exposed to a penalty. Renew the oldest first.',
        rank: (a, b) => a.licenseDays - b.licenseDays,
      },
      {
        id: 'expiring',
        label: 'Expiring',
        rule: 'Under 90 days left',
        tone: 'neutral',
        match: (s) => s.license === 'expiring',
        banner: 'Start renewal now to avoid a gap.',
        rank: (a, b) => a.licenseDays - b.licenseDays,
      },
    ],
    columns: [
      regionColumn,
      { label: 'License', render: (s) => s.licenseNo },
      { label: 'Expiry', render: (s) => dateFromAsOf(s.licenseDays) },
      { label: 'Days left', numeric: true, render: (s) => fmt.int(s.licenseDays) },
    ],
    summary(sites, bucket, regionId) {
      if (!sites.length) return `No sites match this filter in ${scope(regionId)}.`;
      const lead = regionId === null ? ` ${topRegion(sites).region.name} has the most.` : '';
      if (bucket.id === 'expired') {
        const oldest = Math.max(...sites.map((s) => -s.licenseDays));
        return `${fmt.int(sites.length)} sites in ${scope(regionId)} have an expired license, the oldest by ${oldest} days.${lead}`;
      }
      if (bucket.id === 'expiring') return `${fmt.int(sites.length)} licenses in ${scope(regionId)} expire within 90 days.${lead}`;
      return `${fmt.int(sites.length)} sites in ${scope(regionId)} hold a valid license.`;
    },
  },
  bills: {
    id: 'bills',
    title: 'Bills',
    intro: 'Upcoming electricity bills. Pick a card to see what is due and when.',
    defaultBucket: 'due7',
    buckets: [
      {
        id: 'later',
        label: 'Due in 8 to 30 days',
        rule: 'Scheduled',
        tone: 'ok',
        match: (s) => s.bill === 'paid-soon',
        banner: 'On schedule.',
        rank: (a, b) => a.billDays - b.billDays,
      },
      {
        id: 'overdue',
        label: 'Overdue',
        rule: 'Past the due date',
        tone: 'alert',
        match: (s) => s.bill === 'overdue',
        banner: 'Late fees apply. Pay the oldest first.',
        rank: (a, b) => a.billDays - b.billDays,
      },
      {
        id: 'due7',
        label: 'Due in 7 days',
        rule: 'Pay this week',
        tone: 'neutral',
        match: (s) => s.bill === 'due7',
        banner: 'Queue these for payment this week.',
        rank: (a, b) => a.billDays - b.billDays,
      },
    ],
    columns: [
      regionColumn,
      { label: 'Due date', render: (s) => dateFromAsOf(s.billDays) },
      { label: 'Days', numeric: true, render: (s) => fmt.int(s.billDays) },
      { label: 'Amount', numeric: true, render: (s) => fmt.usd(s.billed) },
    ],
    summary(sites, bucket, regionId) {
      if (!sites.length) return `No sites match this filter in ${scope(regionId)}.`;
      const total = sites.reduce((sum, s) => sum + s.billed, 0);
      if (bucket.id === 'overdue') return `${fmt.int(sites.length)} bills in ${scope(regionId)} are overdue, worth ${fmt.compactUsd(total)}.`;
      return `${fmt.int(sites.length)} bills in ${scope(regionId)} worth ${fmt.compactUsd(total)} fall in this window.`;
    },
  },
};

export const toneColor: Record<Tone, [number, number, number]> = {
  ok: [198, 242, 78],
  alert: [255, 107, 74],
  neutral: [250, 250, 247],
};
