import { REGIONS, type Site, fmt, regionName, dateFromAsOf } from './data';
import type { LensId } from './lenses';

export interface Applied {
  view: LensId;
  bucket: string;
  sub: string | null;
  region: number | null;
  label: string;
}

export interface Reply {
  text: string;
  sites: Site[];
  note?: (site: Site) => string;
  applied?: Applied;
}

export const SUGGESTIONS = [
  'Top 3 sites off forecast in Ironridge',
  'How many licenses have expired?',
  'Which bills are overdue in Kestrel Isles?',
  'Give me a summary of October',
];

export function explainSite(site: Site) {
  const where = regionName(site.region);
  const usage = `${fmt.int(site.actual)} kWh against a forecast of ${fmt.int(site.predicted)} kWh`;
  if (site.status === 'field') {
    const direction = site.deviation > 0 ? 'more' : 'less';
    const bill = site.billed - site.expectedBill;
    const billLine = bill > 0 ? ` The bill came in ${fmt.usd(bill)} above forecast.` : '';
    return `${site.code} in ${where} used ${Math.abs(site.deviation * 100).toFixed(0)}% ${direction} power than forecast in October: ${usage}. Likely cause: ${site.cause.toLowerCase()}.${billLine}`;
  }
  if (site.status === 'minimum') {
    return `${site.code} in ${where} barely drew power in October: ${usage}. Likely cause: ${site.cause.toLowerCase()}.`;
  }
  return `${site.code} in ${where} is on forecast: ${usage}. No action needed.`;
}

function scoped(sites: Site[], region: number | null, match: (s: Site) => boolean) {
  return sites.filter((s) => (region === null || s.region === region) && match(s));
}

const inRegion = (region: number | null) => (region === null ? 'across the network' : `in ${regionName(region)}`);

export function answer(question: string, sites: Site[]): Reply {
  const q = question.toLowerCase();
  const code = q.match(/vw-\d{2}-\d{5}/);
  if (code) {
    const site = sites.find((s) => s.code.toLowerCase() === code[0]);
    if (site) return { text: explainSite(site), sites: [site] };
    return { text: `No site has the code ${code[0].toUpperCase()}. Site codes look like VW-03-48213.`, sites: [] };
  }

  const regionMatch = REGIONS.find((r) => q.includes(r.name.toLowerCase()) || new RegExp(`\\b${r.code.toLowerCase()}\\b`).test(q));
  const region = regionMatch?.id ?? null;
  const topMatch = q.match(/top\s+(\d+)/);
  const limit = Math.min(topMatch ? Number(topMatch[1]) : 3, 5);

  if (/licen[sc]e|permit/.test(q)) {
    const expiring = /expir(ing|es)|soon|renew/.test(q) && !/expired/.test(q);
    const list = scoped(sites, region, (s) => s.license === (expiring ? 'expiring' : 'expired')).sort((a, b) => a.licenseDays - b.licenseDays);
    const word = expiring ? 'expire within 90 days' : 'have expired';
    return {
      text: `${fmt.int(list.length)} licenses ${word} ${inRegion(region)}.`,
      sites: list.slice(0, limit),
      note: (s) => (s.licenseDays < 0 ? `Expired ${-s.licenseDays} days ago` : `${s.licenseDays} days left`),
      applied: { view: 'licenses', bucket: expiring ? 'expiring' : 'expired', sub: null, region, label: expiring ? 'Expiring licenses' : 'Expired licenses' },
    };
  }

  if (/bill|invoice|payment|overdue|due/.test(q)) {
    const overdue = !/this week|7 days|soon|upcoming/.test(q);
    const list = scoped(sites, region, (s) => s.bill === (overdue ? 'overdue' : 'due7')).sort((a, b) => a.billDays - b.billDays);
    const total = list.reduce((sum, s) => sum + s.billed, 0);
    return {
      text: `${fmt.int(list.length)} bills ${overdue ? 'are overdue' : 'fall due within 7 days'} ${inRegion(region)}, worth ${fmt.compactUsd(total)}.${list[0] ? ` The earliest date is ${dateFromAsOf(list[0].billDays)}.` : ''}`,
      sites: list.slice(0, limit),
      note: (s) => `${fmt.usd(s.billed)}, due ${dateFromAsOf(s.billDays)}`,
      applied: { view: 'bills', bucket: overdue ? 'overdue' : 'due7', sub: null, region, label: overdue ? 'Overdue bills' : 'Bills due in 7 days' },
    };
  }

  if (/minimum|no power|zero|not reporting|powered down/.test(q)) {
    const list = scoped(sites, region, (s) => s.status === 'minimum').sort((a, b) => a.actual - b.actual);
    return {
      text: `${fmt.int(list.length)} sites ${inRegion(region)} used under 150 kWh in October.`,
      sites: list.slice(0, limit),
      note: (s) => `${fmt.int(s.actual)} kWh`,
      applied: { view: 'anomalies', bucket: 'minimum', sub: null, region, label: 'Minimum energy' },
    };
  }

  const priorityMatch = q.match(/\bp(?:riority\s*)?([1-4])\b/);
  if (/anomal|off forecast|deviat|critical|worst|unusual|priority|\bp[1-4]\b/.test(q) || (region !== null && !/summar/.test(q))) {
    const priority = /critical/.test(q) ? 1 : priorityMatch ? Number(priorityMatch[1]) : null;
    const list = scoped(sites, region, (s) => s.status === 'field' && (priority === null || s.priority === priority)).sort(
      (a, b) => a.priority - b.priority || Math.abs(b.deviation) - Math.abs(a.deviation),
    );
    const label = priority ? `P${priority} field anomalies` : 'Field anomalies';
    const lead = list[0] ? ` The worst is ${list[0].code} at ${fmt.signedPct(list[0].deviation)}.` : '';
    return {
      text: `${fmt.int(list.length)} ${priority ? `P${priority} ` : ''}sites ran off forecast ${inRegion(region)} in October.${lead}`,
      sites: list.slice(0, limit),
      applied: { view: 'anomalies', bucket: 'field', sub: priority ? `p${priority}` : null, region, label },
    };
  }

  if (/highest|most power|consum|usage/.test(q)) {
    const list = scoped(sites, region, () => true).sort((a, b) => b.actual - a.actual);
    return { text: `These sites used the most power ${inRegion(region)} in October.`, sites: list.slice(0, limit), note: (s) => `${fmt.int(s.actual)} kWh` };
  }

  if (/summar|brief|overview|october|what should|today/.test(q)) {
    const field = scoped(sites, null, (s) => s.status === 'field');
    const p1 = field.filter((s) => s.priority === 1).length;
    const expired = scoped(sites, null, (s) => s.license === 'expired').length;
    const overdue = scoped(sites, null, (s) => s.bill === 'overdue').length;
    return {
      text: `October in short: ${fmt.int(field.length)} sites ran off forecast, ${fmt.int(p1)} of them P1. ${fmt.int(expired)} licenses have expired and ${fmt.int(overdue)} bills are overdue. Start with the P1 sites, because those are already changing the bill.`,
      sites: [],
      applied: { view: 'anomalies', bucket: 'field', sub: 'p1', region: null, label: 'P1 field anomalies' },
    };
  }

  return {
    text: 'I can answer questions about anomalies, licenses and bills. Try naming a region, a priority such as P1, or a site code.',
    sites: [],
  };
}
