import { useEffect, useMemo, useRef } from 'react';
import { MONTHS, REGIONS, type Site, dateFromAsOf, fmt, siteSeries } from './data';
import { explainSite } from './assistant-engine';
import { LineChart } from './LineChart';
import { Icon } from './Icon';

const STATUS = { normal: 'On forecast', field: 'Field anomaly', minimum: 'Minimum energy' };
const TONE = { normal: 'ok', field: 'alert', minimum: 'neutral' };

export function SiteDialog({ site, onClose, onAsk }: { site: Site; onClose: () => void; onAsk: (site: Site) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const points = useMemo(() => siteSeries(site), [site]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={ref} className="vw vw-site" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-labelledby="vw-site-title">
      <header>
        <div>
          <p>{REGIONS[site.region].name}</p>
          <h2 id="vw-site-title">{site.code}</h2>
        </div>
        <button type="button" className="vw-icon-btn" onClick={onClose} aria-label="Close site detail"><Icon name="close" /></button>
      </header>

      <span className="vw-status" data-tone={TONE[site.status]}>{STATUS[site.status]}{site.priority ? ` P${site.priority}` : ''}</span>

      <section className="vw-insight" data-tone={TONE[site.status]}>
        <Icon name="spark" />
        <div>
          <h3>AI explanation</h3>
          <p>{explainSite(site)}</p>
        </div>
      </section>

      <LineChart
        title={`Monthly usage for ${site.code}`}
        labels={MONTHS}
        height={200}
        format={(n) => `${fmt.int(n)} kWh`}
        axisFormat={fmt.int}
        series={[
          { name: 'Forecast', values: points.map((p) => p.predicted), colour: '#A1A1AA', dashed: true },
          { name: 'Actual', values: points.map((p) => p.actual), colour: '#C6F24E' },
        ]}
      />

      <dl className="vw-facts">
        <div><dt>October bill</dt><dd>{fmt.usd(site.billed)}</dd></div>
        <div><dt>Bill due</dt><dd>{dateFromAsOf(site.billDays)}</dd></div>
        <div><dt>License</dt><dd>{site.licenseNo}</dd></div>
        <div><dt>License expiry</dt><dd>{dateFromAsOf(site.licenseDays)}</dd></div>
      </dl>

      <button type="button" className="vw-btn vw-btn-primary" onClick={() => onAsk(site)}>
        <Icon name="spark" size={16} /> Ask about this site
      </button>
    </dialog>
  );
}
