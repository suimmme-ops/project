import { useEffect, useRef, useState } from 'react';
import { CardCanvas, describeCard } from './CardCanvas';
import { renderCardPng, type CardState } from '../lib/drawCard';
import { cardText } from '../data/content';

type Props = {
  open: boolean;
  card: CardState;
  onClose: () => void;
  onEdit: () => void;
};

type Status = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done' } | { kind: 'error'; reason: string };

export function CompleteModal({ open, card, onClose, onEdit }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const saveBtn = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setStatus({ kind: 'idle' });
      d.showModal();
      saveBtn.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);

  const save = async () => {
    setStatus({ kind: 'busy' });
    try {
      const blob = await renderCardPng(card);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cardText.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setStatus({ kind: 'done' });
    } catch (err) {
      console.error('[카드 저장 실패]', err);
      const reason = err instanceof Error ? err.message : String(err);
      setStatus({ kind: 'error', reason });
    }
  };

  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <div className="modal__inner">
        <div className="modal__head">
          <h2 id="modal-title">카드가 완성됐어요</h2>
          <button type="button" className="icon-btn" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="modal__card">{open && <CardCanvas card={card} className="card-canvas" label={describeCard(card)} />}</div>
        <div className="modal__actions">
          <button ref={saveBtn} type="button" className="btn btn--primary" onClick={save} disabled={status.kind === 'busy'} aria-describedby="save-status">
            {status.kind === 'busy' ? '이미지 만드는 중…' : 'PNG로 저장'}
          </button>
          <button type="button" className="btn btn--secondary" onClick={onEdit}>
            다시 꾸미기
          </button>
        </div>
        <p id="save-status" className={status.kind === 'error' ? 'help is-error' : 'help'} role="status" aria-live="polite">
          {status.kind === 'busy' && '이미지 만드는 중…'}
          {status.kind === 'done' && `${cardText.fileName} 파일을 저장했어요. (1080×1350)`}
          {status.kind === 'error' && `저장하지 못했어요. 다시 눌러 주세요. 원인: ${status.reason}`}
          {status.kind === 'idle' && '1080×1350 크기 PNG로 저장됩니다.'}
        </p>
      </div>
    </dialog>
  );
}
