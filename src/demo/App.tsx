import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './demo.css';
import { AS_OF, REGIONS, type Site, fmt, getSites } from './data';
import { LENSES, type LensId } from './lenses';
import { DrillDown, type Selection } from './DrillDown';
import { ForecastView } from './ForecastView';
import { SiteDialog } from './SiteDialog';
import { Assistant, type Message } from './Assistant';
import { answer, type Applied } from './assistant-engine';
import { Icon, type IconName } from './Icon';

type View = LensId | 'forecast';

const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: 'anomalies', label: 'Anomalies', icon: 'alert' },
  { id: 'forecast', label: 'Forecast', icon: 'chart' },
  { id: 'licenses', label: 'Licenses', icon: 'badge' },
  { id: 'bills', label: 'Bills', icon: 'bill' },
];

function readHash(): View {
  const id = window.location.hash.slice(1);
  return NAV.some((n) => n.id === id) ? (id as View) : 'anomalies';
}

const AS_OF_LABEL = AS_OF.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function App({ backHref = '/work/energy-analytics' }: { backHref?: string }) {
  const sites = useMemo(() => getSites(), []);
  const [view, setView] = useState<View>('anomalies');
  const [regionId, setRegionId] = useState<number | null>(null);
  const [selection, setSelection] = useState<Record<LensId, Selection>>({
    anomalies: { bucket: LENSES.anomalies.defaultBucket, sub: null },
    licenses: { bucket: LENSES.licenses.defaultBucket, sub: null },
    bills: { bucket: LENSES.bills.defaultBucket, sub: null },
  });
  const [openSite, setOpenSite] = useState<Site | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(0);

  useEffect(() => {
    setView(readHash());
    const onHash = () => setView(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useCallback((next: View) => {
    window.history.replaceState(null, '', `#${next}`);
    setView(next);
  }, []);

  const apply = useCallback(
    (applied: Applied) => {
      go(applied.view);
      setRegionId(applied.region);
      setSelection((current) => ({ ...current, [applied.view]: { bucket: applied.bucket, sub: applied.sub } }));
    },
    [go],
  );

  const ask = useCallback(
    (question: string) => {
      const reply = answer(question, sites);
      setMessages((list) => [...list, { id: nextId.current++, question, reply }]);
      setAssistantOpen(true);
      if (reply.applied) apply(reply.applied);
    },
    [sites, apply],
  );

  const title = NAV.find((n) => n.id === view)?.label ?? '';

  return (
    <div className="vw vw-app" data-assistant={assistantOpen || undefined}>
      <aside className="vw-side">
        <div className="vw-brand">
          <span aria-hidden="true"><Icon name="bolt" size={18} /></span>
          <strong>Voltwise</strong>
        </div>
        <nav aria-label="Dashboard sections">
          {NAV.map((item) => (
            <button type="button" key={item.id} aria-current={view === item.id ? 'page' : undefined} onClick={() => go(item.id)}>
              <Icon name={item.icon} /> {item.label}
            </button>
          ))}
        </nav>
        <a className="vw-back" href={backHref}><Icon name="back" size={16} /> Back to case study</a>
      </aside>

      <div className="vw-main">
        <p className="vw-notice">
          Fictional product built by Glen Hutajulu to show the design. Every name and number is dummy data.
        </p>
        <header className="vw-top">
          <div>
            <h1>{title}</h1>
            <p>{fmt.int(sites.length)} sites, data to {AS_OF_LABEL}</p>
          </div>
          <div className="vw-top-actions">
            <label className="vw-select">
              <span className="vw-sr">Region</span>
              <select value={regionId ?? ''} onChange={(e) => setRegionId(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">All regions</option>
                {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </label>
            <button type="button" className="vw-btn vw-btn-primary" aria-expanded={assistantOpen} onClick={() => setAssistantOpen((v) => !v)}>
              <Icon name="spark" size={16} /> Ask Voltwise
            </button>
          </div>
        </header>
        <main>
          {view === 'forecast' ? (
            <ForecastView sites={sites} regionId={regionId} />
          ) : (
            <DrillDown
              key={view}
              lensId={view}
              sites={sites}
              selection={selection[view]}
              regionId={regionId}
              onSelect={(next) => setSelection((current) => ({ ...current, [view]: next }))}
              onRegion={setRegionId}
              onOpenSite={setOpenSite}
            />
          )}
        </main>
      </div>

      {assistantOpen && <Assistant messages={messages} onAsk={ask} onClose={() => setAssistantOpen(false)} onOpenSite={setOpenSite} />}
      {openSite && (
        <SiteDialog
          key={openSite.index}
          site={openSite}
          onClose={() => setOpenSite(null)}
          onAsk={(site) => {
            setOpenSite(null);
            ask(`Why is ${site.code} flagged?`);
          }}
        />
      )}
    </div>
  );
}
