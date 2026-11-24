import { useCallback, useRef, useState } from 'react';
import { Globe } from './components/Globe';
import { Editor } from './components/Editor';
import { CompleteModal } from './components/CompleteModal';
import { defaults, site } from './data/content';
import type { CardState } from './lib/drawCard';

function Snowflake() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="btn__icon">
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
        <path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5M4.6 10.4l3.4.9-.9 3.4M19.4 13.6l-3.4-.9.9-3.4M4.6 13.6l3.4-.9-.9-3.4M19.4 10.4l-3.4.9.9 3.4" />
      </g>
    </svg>
  );
}

export default function App() {
  const [card, setCardState] = useState<CardState>({ ...defaults, theme: 'check', cookie: true });
  const [baseline, setBaseline] = useState(defaults.message);
  const [burstKey, setBurstKey] = useState(0);
  const [modal, setModal] = useState(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const lastBurst = useRef(0);

  const setCard = useCallback((fn: (c: CardState) => CardState) => setCardState(fn), []);

  const burst = useCallback(() => {
    // 아주 빠른 연타는 한 번으로 묶습니다(효과 세기는 3D 쪽에서 상한을 둠).
    const now = performance.now();
    if (now - lastBurst.current < 180) return;
    lastBurst.current = now;
    setBurstKey((k) => k + 1);
  }, []);

  const closeModal = () => {
    setModal(false);
    requestAnimationFrame(() => trigger.current?.focus());
  };

  const editAgain = () => {
    setModal(false);
    requestAnimationFrame(() => {
      const first = document.querySelector<HTMLInputElement>('#make input[type="text"]');
      first?.focus();
    });
  };

  const { hero } = site;

  return (
    <>
      <a className="skip-link" href="#make">
        카드 만들기로 바로 가기
      </a>
      <header className="hero" id="top">
        <div className="hero__frame">
          <nav className="topbar" aria-label="주요 메뉴">
            <a className="topbar__brand" href="#top">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.9c0 5.4-7.5 10-7.5 10Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {site.name}
            </a>
            <ul className="topbar__links">
              {site.nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <p className="display" lang="en" aria-hidden="true">
            <span className="display__l1 enter" style={{ ['--d' as string]: '40ms' }}>
              {hero.display[0]}
            </span>
            <span className="display__l2 enter" style={{ ['--d' as string]: '120ms' }}>
              {hero.display[1]}
            </span>
          </p>

          <div className="hero__globe enter enter--rise" style={{ ['--d' as string]: '220ms' }}>
            <Globe burstKey={burstKey} onBurst={burst} />
          </div>

          <button type="button" className="snow-btn enter" style={{ ['--d' as string]: '420ms' }} onClick={burst}>
            <span className="snow-btn__ring" aria-hidden="true">
              <Snowflake />
            </span>
            <span>{hero.snow}</span>
          </button>

          <div className="hero__copy enter" style={{ ['--d' as string]: '320ms' }}>
            <p className="eyebrow" lang="en">
              {hero.eyebrow}
            </p>
            <h1>
              {/* 쉼표 뒤에서 줄을 바꿔 어절이 어색하게 끊기지 않게 합니다. */}
              {hero.title.split(', ').map((part, i, arr) => (
                <span key={i} className="h1-line">
                  {part}
                  {i < arr.length - 1 ? ',' : ''}
                </span>
              ))}
            </h1>
            <p className="hero__lead">{hero.lead}</p>
            <a className="btn btn--primary btn--hero" href="#make">
              {hero.primary}
              <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" className="btn__arrow">
                <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="section how" id="how" aria-labelledby="how-t">
          <div className="wrap">
            <div className="section-head section-head--row">
              <div>
                <p className="kicker" lang="en">
                  How it works
                </p>
                <h2 id="how-t">{site.how.title}</h2>
              </div>
              <p className="lead">{site.how.lead}</p>
            </div>
            <ol className="steps">
              {site.how.steps.map((s) => (
                <li key={s.no} className="step">
                  <span className="step__no" lang="en" aria-hidden="true">
                    {s.no}
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <Editor
          card={card}
          setCard={setCard}
          baseline={baseline}
          setBaseline={setBaseline}
          onComplete={(btn) => {
            trigger.current = btn;
            setModal(true);
          }}
        />
      </main>

      <footer className="footer">
        <div className="wrap footer__inner">
          <p className="footer__closing">{site.footer.closing}</p>
          <div className="footer__meta">
            <p className="footer__small" lang="en">
              {site.footer.small}
            </p>
            <p className="footer__note">{site.footer.note}</p>
          </div>
        </div>
      </footer>

      <CompleteModal open={modal} card={card} onClose={closeModal} onEdit={editAgain} />
    </>
  );
}
