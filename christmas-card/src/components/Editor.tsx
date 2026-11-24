import { useId, useState } from 'react';
import { CardCanvas } from './CardCanvas';
import { limits, presets, site, themes, type Preset, type ThemeId } from '../data/content';
import type { CardState } from '../lib/drawCard';

type Props = {
  card: CardState;
  setCard: (fn: (c: CardState) => CardState) => void;
  baseline: string;
  setBaseline: (s: string) => void;
  onComplete: (trigger: HTMLButtonElement) => void;
};

const count = (s: string) => Array.from(s).length;

function clampLines(text: string) {
  const lines = text.split('\n');
  if (lines.length <= limits.messageLines) return text;
  const keep = lines.slice(0, limits.messageLines - 1);
  keep.push(lines.slice(limits.messageLines - 1).join(' '));
  return keep.join('\n');
}

export function Editor({ card, setCard, baseline, setBaseline, onComplete }: Props) {
  const id = useId();
  const [pending, setPending] = useState<Preset | null>(null);
  const [notice, setNotice] = useState('');

  const apply = (p: Preset) => {
    setCard((c) => ({ ...c, message: p.text }));
    setBaseline(p.text);
    setPending(null);
    setNotice(`‘${p.label}’ 문구를 넣었어요.`);
  };

  const choose = (p: Preset) => {
    if (card.message === p.text) return;
    // 사용자가 직접 고친 문장이 있으면 바꾸기 전에 확인
    if (card.message.trim() && card.message !== baseline) {
      setPending(p);
      setNotice('');
    } else apply(p);
  };

  const msgLen = count(card.message);
  const messageEmpty = !card.message.trim();

  return (
    <section className="section editor" id="make" aria-labelledby={`${id}-t`}>
      <div className="wrap">
        <div className="section-head">
          <p className="kicker" lang="en">
            Make a card
          </p>
          <h2 id={`${id}-t`}>{site.editor.title}</h2>
          <p className="lead">{site.editor.lead}</p>
        </div>

        <div className="editor__grid">
          <div className="editor__preview">
            <div className="card-frame">
              <CardCanvas card={card} className="card-canvas" />
            </div>
          </div>

          <form
            className="editor__tools"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <div className="field">
              <div className="field__row">
                <label htmlFor={`${id}-to`}>받는 사람</label>
                <span className="counter" aria-hidden="true">
                  {count(card.recipient)}/{limits.recipient}
                </span>
              </div>
              <input
                id={`${id}-to`}
                type="text"
                value={card.recipient}
                maxLength={limits.recipient}
                autoComplete="off"
                placeholder="예: 고마운 선생님께"
                onChange={(e) => setCard((c) => ({ ...c, recipient: e.target.value }))}
              />
            </div>

            <div className="field">
              <div className="field__row">
                <label htmlFor={`${id}-msg`}>감사 메시지</label>
                <span className={msgLen >= limits.message ? 'counter is-full' : 'counter'} id={`${id}-msg-count`} aria-live="polite">
                  {msgLen}/{limits.message}자
                </span>
              </div>
              <textarea
                id={`${id}-msg`}
                value={card.message}
                maxLength={limits.message}
                rows={4}
                aria-describedby={`${id}-msg-count ${id}-msg-help`}
                aria-invalid={messageEmpty || undefined}
                onChange={(e) => setCard((c) => ({ ...c, message: clampLines(e.target.value) }))}
              />
              <p className={messageEmpty ? 'help is-error' : 'help'} id={`${id}-msg-help`}>
                {messageEmpty ? '메시지를 한 글자 이상 적어 주세요.' : `줄바꿈은 ${limits.messageLines}줄까지 들어가요.`}
              </p>
            </div>

            <div className="field">
              <div className="field__row">
                <label htmlFor={`${id}-from`}>보내는 사람</label>
                <span className="counter" aria-hidden="true">
                  {count(card.sender)}/{limits.sender}
                </span>
              </div>
              <input
                id={`${id}-from`}
                type="text"
                value={card.sender}
                maxLength={limits.sender}
                autoComplete="off"
                placeholder="예: 마음을 담아"
                onChange={(e) => setCard((c) => ({ ...c, sender: e.target.value }))}
              />
            </div>

            <fieldset className="field">
              <legend>추천 문구</legend>
              <div className="chips">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="chip"
                    aria-pressed={card.message === p.text}
                    onClick={() => choose(p)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="confirm-slot" aria-live="polite">
                {pending ? (
                  <div className="confirm" role="group" aria-label="문구 바꾸기 확인">
                    <p>직접 고친 문장을 ‘{pending.label}’ 문구로 바꿀까요?</p>
                    <div className="confirm__actions">
                      <button type="button" className="chip chip--solid" onClick={() => apply(pending)}>
                        바꾸기
                      </button>
                      <button type="button" className="chip" onClick={() => setPending(null)}>
                        그대로 두기
                      </button>
                    </div>
                  </div>
                ) : (
                  notice && <p className="help">{notice}</p>
                )}
              </div>
            </fieldset>

            <fieldset className="field">
              <legend>카드 배경</legend>
              <div className="themes">
                {themes.map((t) => (
                  <label key={t.id} className="theme">
                    <input
                      type="radio"
                      name={`${id}-theme`}
                      value={t.id}
                      checked={card.theme === t.id}
                      onChange={() => setCard((c) => ({ ...c, theme: t.id as ThemeId }))}
                    />
                    <span className="theme__thumb">
                      <CardCanvas card={{ ...card, theme: t.id }} scale={0.12} label="" />
                      <span className="theme__mark" aria-hidden="true">
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </span>
                    <span className="theme__label">{t.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="field field--switch">
              <label className="switch" htmlFor={`${id}-cookie`}>
                <input
                  id={`${id}-cookie`}
                  type="checkbox"
                  role="switch"
                  checked={card.cookie}
                  onChange={(e) => setCard((c) => ({ ...c, cookie: e.target.checked }))}
                />
                <span className="switch__track" aria-hidden="true" />
                <span className="switch__text">쿠키 넣기</span>
                <span className="switch__state" aria-hidden="true">
                  {card.cookie ? '켜짐' : '꺼짐'}
                </span>
              </label>
            </div>

            <div className="editor__actions">
              <button
                type="button"
                className="btn btn--primary btn--block"
                disabled={messageEmpty}
                onClick={(e) => onComplete(e.currentTarget)}
              >
                {site.editor.complete}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
