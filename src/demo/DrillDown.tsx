import { useEffect, useMemo, useState } from 'react';
import { REGIONS, type Site, fmt } from './data';
import { LENSES, type Bucket, type LensId } from './lenses';
import { DotMap } from './DotMap';
import { Icon } from './Icon';

export interface Selection {
  bucket: string;
  sub: string | null;
}

interface Props {
  lensId: LensId;
  sites: Site[];
  selection: Selection;
  regionId: number | null;
  onSelect: (selection: Selection) => void;
  onRegion: (id: number | null) => void;
  onOpenSite: (site: Site) => void;
}

const PAGE_SIZE = 10;

function KpiCard({ bucket, count, total, selected, onClick }: { bucket: Bucket; count: number; total: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className="vw-kpi" data-tone={bucket.tone} aria-pressed={selected} onClick={onClick}>
      <span className="vw-kpi-head">
        <i aria-hidden="true" />
        {bucket.label}
        {selected && <Icon name="check" size={16} />}
      </span>
      <span className="vw-kpi-value">
        <b>{fmt.int(count)}</b>
        <small>{fmt.pct(count / total || 0)}</small>
      </span>
      <span className="vw-kpi-rule">{bucket.rule}</span>
    </button>
  );
}

export function DrillDown({ lensId, sites, selection, regionId, onSelect, onRegion, onOpenSite }: Props) {
  const lens = LENSES[lensId];
  const bucket = lens.buckets.find((b) => b.id === selection.bucket) ?? lens.buckets[0];
  const sub = bucket.subFilters?.find((s) => s.id === selection.sub) ?? null;
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hoverRegion, setHoverRegion] = useState<number | null>(null);

  const inScope = useMemo(() => (regionId === null ? sites : sites.filter((s) => s.region === regionId)), [sites, regionId]);
  const counts = useMemo(() => lens.buckets.map((b) => inScope.filter(b.match).length), [inScope, lens]);

  // Everything below the cards reads from these two lists, so one click updates the whole view.
  const bucketSites = useMemo(() => sites.filter(bucket.match), [sites, bucket]);
  const activeAllRegions = useMemo(() => (sub ? bucketSites.filter(sub.match) : bucketSites), [bucketSites, sub]);
  const active = useMemo(
    () => (regionId === null ? activeAllRegions : activeAllRegions.filter((s) => s.region === regionId)),
    [activeAllRegions, regionId],
  );

  const ranking = useMemo(() => {
    const tally = new Array(REGIONS.length).fill(0);
    for (const site of activeAllRegions) tally[site.region]++;
    return REGIONS.map((region) => ({ region, count: tally[region.id] })).sort((a, b) => b.count - a.count);
  }, [activeAllRegions]);
  const maxCount = ranking[0]?.count || 1;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = needle ? active.filter((s) => s.code.toLowerCase().includes(needle)) : active;
    return [...list].sort(bucket.rank);
  }, [active, query, bucket]);

  useEffect(() => setPage(0), [rows]);

  const pageCount = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const visible = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const total = inScope.length;

  const exportCsv = () => {
    const header = ['Site', ...lens.columns.map((c) => c.label)];
    const lines = rows.map((s) => [s.code, ...lens.columns.map((c) => c.render(s))].map((v) => `"${v}"`).join(','));
    const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voltwise-${lens.id}-${bucket.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vw-stack">
      <p className="vw-intro">{lens.intro}</p>

      <div className="vw-mix" role="img" aria-label={lens.buckets.map((b, i) => `${b.label} ${fmt.int(counts[i])}`).join(', ')}>
        {lens.buckets.map((b, i) => (
          <span key={b.id} data-tone={b.tone} style={{ flexGrow: Math.max(counts[i], total * 0.008) }} />
        ))}
      </div>

      <div className="vw-kpis">
        {lens.buckets.map((b, i) => (
          <KpiCard key={b.id} bucket={b} count={counts[i]} total={total} selected={b.id === bucket.id} onClick={() => onSelect({ bucket: b.id, sub: null })} />
        ))}
      </div>

      {bucket.subFilters && (
        <div className="vw-pills" role="group" aria-label="Filter by priority">
          <button type="button" aria-pressed={!sub} onClick={() => onSelect({ bucket: bucket.id, sub: null })}>
            All <b>{fmt.int(bucketSites.filter((s) => regionId === null || s.region === regionId).length)}</b>
          </button>
          {bucket.subFilters.map((f) => (
            <button type="button" key={f.id} aria-pressed={sub?.id === f.id} onClick={() => onSelect({ bucket: bucket.id, sub: sub?.id === f.id ? null : f.id })}>
              {f.label} <b>{fmt.int(bucketSites.filter((s) => f.match(s) && (regionId === null || s.region === regionId)).length)}</b>
            </button>
          ))}
        </div>
      )}

      <section className="vw-insight" data-tone={bucket.tone} aria-live="polite">
        <Icon name="spark" />
        <div>
          <h3>AI summary</h3>
          <p>{lens.summary(active, bucket, regionId)}</p>
          <p className="vw-insight-next">{sub ? sub.note : bucket.banner}</p>
        </div>
      </section>

      <div className="vw-split">
        <section className="vw-card">
          <header className="vw-card-head">
            <h2>Regions by site count</h2>
            <p>Select a region to filter the map and table</p>
          </header>
          <ol className="vw-rank">
            {ranking.map(({ region, count }) => (
              <li key={region.id}>
                <button
                  type="button"
                  aria-pressed={regionId === region.id}
                  onClick={() => onRegion(regionId === region.id ? null : region.id)}
                  onPointerEnter={() => setHoverRegion(region.id)}
                  onPointerLeave={() => setHoverRegion(null)}
                >
                  <span className="vw-rank-name">
                    <em>{region.code}</em>
                    {region.name}
                  </span>
                  <b>{fmt.int(count)}</b>
                  <span className="vw-rank-bar" data-tone={bucket.tone}>
                    <i style={{ width: `${(count / maxCount) * 100}%` }} />
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="vw-card">
          <header className="vw-card-head">
            <h2>Site map</h2>
            <p>
              {fmt.int(active.length)} of {fmt.int(total)} sites shown in colour
            </p>
          </header>
          <DotMap
            sites={sites}
            active={activeAllRegions}
            tone={bucket.tone}
            regionId={regionId}
            hoverRegion={hoverRegion}
            onRegion={(id) => onRegion(regionId === id ? null : id)}
            onHoverRegion={setHoverRegion}
            label={`Map of ${fmt.int(total)} sites. ${fmt.int(active.length)} match ${bucket.label}.`}
          />
        </section>
      </div>

      <section className="vw-card">
        <header className="vw-card-head vw-card-head-row">
          <div>
            <h2>{sub ? `${bucket.label} ${sub.label}` : bucket.label} sites</h2>
            <p>Worst first. Select a row for the site explanation.</p>
          </div>
          <button type="button" className="vw-btn" onClick={exportCsv}>
            <Icon name="download" size={16} /> Export CSV
          </button>
        </header>
        <label className="vw-search">
          <Icon name="search" size={16} />
          <span className="vw-sr">Search by site code</span>
          <input type="search" value={query} placeholder="Search by site code" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="vw-table-wrap" tabIndex={0} role="region" aria-label={`${bucket.label} sites table`}>
          <table className="vw-table">
            <thead>
              <tr>
                <th scope="col">Site</th>
                {lens.columns.map((c) => (
                  <th scope="col" key={c.label} data-numeric={c.numeric || undefined}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((site) => (
                <tr key={site.index} onClick={() => onOpenSite(site)}>
                  <th scope="row">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onOpenSite(site); }}>{site.code}</button>
                  </th>
                  {lens.columns.map((c) => (
                    <td key={c.label} data-numeric={c.numeric || undefined}>{c.render(site)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="vw-empty">No sites match. Clear the search or pick another card.</p>}
        </div>
        <footer className="vw-pager">
          <span>
            {rows.length ? `${fmt.int(page * PAGE_SIZE + 1)} to ${fmt.int(Math.min((page + 1) * PAGE_SIZE, rows.length))} of ${fmt.int(rows.length)}` : '0 sites'}
          </span>
          <div>
            <button type="button" className="vw-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <button type="button" className="vw-btn" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </footer>
      </section>
    </div>
  );
}
