import { useEffect, useRef, useState, type FormEvent } from 'react';
import { type Site, fmt } from './data';
import { SUGGESTIONS, type Reply } from './assistant-engine';
import { Icon } from './Icon';

export interface Message {
  id: number;
  question: string;
  reply: Reply;
}

interface Props {
  messages: Message[];
  onAsk: (question: string) => void;
  onClose: () => void;
  onOpenSite: (site: Site) => void;
}

export function Assistant({ messages, onAsk, onClose, onOpenSite }: Props) {
  const [draft, setDraft] = useState('');
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    onAsk(question);
    setDraft('');
  };

  return (
    <aside className="vw-assistant" aria-label="Assistant">
      <header>
        <h2><Icon name="spark" /> Ask Voltwise</h2>
        <button type="button" className="vw-icon-btn" onClick={onClose} aria-label="Close assistant"><Icon name="close" /></button>
      </header>
      <div className="vw-log" ref={log} aria-live="polite">
        {!messages.length && <p className="vw-log-hello">Ask in plain language. Answers filter the dashboard behind this panel.</p>}
        {messages.map((m) => (
          <article key={m.id}>
            <p className="vw-q">{m.question}</p>
            <div className="vw-a">
              <p>{m.reply.text}</p>
              {m.reply.sites.map((site) => (
                <button type="button" key={site.index} className="vw-a-site" onClick={() => onOpenSite(site)}>
                  <b>{site.code}</b>
                  <span>{m.reply.note ? m.reply.note(site) : `${fmt.signedPct(site.deviation)} against forecast`}</span>
                </button>
              ))}
              {m.reply.applied && <p className="vw-a-note"><Icon name="check" size={14} /> Filter applied: {m.reply.applied.label}</p>}
            </div>
          </article>
        ))}
      </div>
      <div className="vw-suggest">
        {SUGGESTIONS.map((s) => (
          <button type="button" key={s} onClick={() => onAsk(s)}>{s}</button>
        ))}
      </div>
      <form onSubmit={submit}>
        <label className="vw-sr" htmlFor="vw-ask">Ask a question</label>
        <input id="vw-ask" ref={input} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about sites, licenses or bills" autoComplete="off" />
        <button type="submit" aria-label="Send question" disabled={!draft.trim()}><Icon name="send" size={16} /></button>
      </form>
      <p className="vw-disclaimer">Scripted for this demo. No model is running, and answers are computed from the dummy data.</p>
    </aside>
  );
}
