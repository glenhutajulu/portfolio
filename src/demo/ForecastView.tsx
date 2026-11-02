import { useMemo } from 'react';
import { MONTHS, type Site, fmt, monthlySeries } from './data';
import { LineChart } from './LineChart';

function Panel({ title, metric, sites, regionId, format, axis }: { title: string; metric: 'energy' | 'cost'; sites: Site[]; regionId: number | null; format: (n: number) => string; axis: (n: number) => string }) {
  const points = useMemo(() => monthlySeries(sites, metric, regionId), [sites, metric, regionId]);
  const predicted = points.map((p) => p.predicted);
  const actual = points.map((p) => p.actual);
  const last = points[points.length - 1];
  const gap = last.actual / last.predicted - 1;
  return (
    <section className="vw-card">
      <header className="vw-card-head">
        <h2>{title}</h2>
      </header>
      <dl className="vw-stats">
        <div><dt>October forecast</dt><dd>{format(last.predicted)}</dd></div>
        <div><dt>October actual</dt><dd>{format(last.actual)}</dd></div>
        <div><dt>Gap</dt><dd>{fmt.signedPct(gap)}</dd></div>
      </dl>
      <LineChart
        title={title}
        labels={MONTHS}
        format={format}
        axisFormat={axis}
        series={[
          { name: 'Forecast', values: predicted, colour: '#A1A1AA', dashed: true },
          { name: 'Actual', values: actual, colour: '#C6F24E' },
        ]}
      />
      <details className="vw-details">
        <summary>View as table</summary>
        <div className="vw-table-wrap">
          <table className="vw-table">
            <thead><tr><th scope="col">Month</th><th scope="col" data-numeric>Forecast</th><th scope="col" data-numeric>Actual</th></tr></thead>
            <tbody>
              {points.map((p, i) => (
                <tr key={MONTHS[i]}><th scope="row">{MONTHS[i]}</th><td data-numeric>{format(p.predicted)}</td><td data-numeric>{format(p.actual)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function ForecastView({ sites, regionId }: { sites: Site[]; regionId: number | null }) {
  return (
    <div className="vw-stack">
      <p className="vw-intro">Twelve months of forecast against metered usage and billed cost. The model is a dummy, and so is the data.</p>
      <div className="vw-split vw-split-even">
        <Panel title="Electricity consumption (MWh)" metric="energy" sites={sites} regionId={regionId} format={fmt.mwh} axis={(n) => `${fmt.int(n / 1000)}`} />
        <Panel title="Electricity billing (USD)" metric="cost" sites={sites} regionId={regionId} format={fmt.compactUsd} axis={(n) => `$${(n / 1e6).toFixed(2)}M`} />
      </div>
    </div>
  );
}
