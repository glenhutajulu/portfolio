import { useMemo, useState } from 'react';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './demo.css';
import { type Site, fmt, getSites } from './data';
import { LENSES } from './lenses';
import { DotMap } from './DotMap';
import { Icon } from './Icon';

export default function HeroPreview() {
  const sites = useMemo<Site[]>(() => getSites(), []);
  const lens = LENSES.anomalies;
  const [bucketId, setBucketId] = useState(lens.defaultBucket);
  const bucket = lens.buckets.find((b) => b.id === bucketId) ?? lens.buckets[0];
  const counts = useMemo(() => lens.buckets.map((b) => sites.filter(b.match).length), [sites, lens]);
  const active = useMemo(() => sites.filter(bucket.match), [sites, bucket]);

  return (
    <div className="vw vw-preview">
      <div className="vw-preview-cards" role="group" aria-label="Filter the map by site status">
        {lens.buckets.map((b, i) => (
          <button type="button" key={b.id} className="vw-kpi" data-tone={b.tone} aria-pressed={b.id === bucket.id} onClick={() => setBucketId(b.id)}>
            <span className="vw-kpi-head">
              <i aria-hidden="true" />
              {b.label}
              {b.id === bucket.id && <Icon name="check" size={16} />}
            </span>
            <span className="vw-kpi-value">
              <b>{fmt.int(counts[i])}</b>
              <small>{fmt.pct(counts[i] / sites.length)}</small>
            </span>
            <span className="vw-kpi-rule">{b.rule}</span>
          </button>
        ))}
      </div>
      <div className="vw-preview-map">
        <DotMap sites={sites} active={active} tone={bucket.tone} regionId={null} label={`Map of ${fmt.int(sites.length)} sites with ${fmt.int(active.length)} highlighted as ${bucket.label}.`} />
        <p aria-live="polite">{lens.summary(active, bucket, null)}</p>
      </div>
    </div>
  );
}
