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

type Status =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'done' }
  | { kind: 'cancelled' }
  | { kind: 'error'; reason: string };

type DownloadsApi = { save: (req: { filename: string; data: Blob }) => Promise<{ status: string }> };
type ClaudeHost = { use: (name: string) => Promise<unknown> };

class Cancelled extends Error {}

const DOWNLOAD_ERRORS: Record<string, string> = {
  rate_limited: '저장 확인 창이 이미 열려 있어요. 잠시 뒤 다시 눌러 주세요.',
  host_unavailable: '이 앱에서는 파일을 저장할 수 없어요. 브라우저나 컴퓨터에서 열어 주세요.',
  unavailable: '이 미리보기 화면에서는 파일 저장이 허용되지 않았어요.',
};

/**
 * 파일 내려받기.
 * - 일반 웹사이트(Netlify 등): 브라우저 다운로드 링크를 사용합니다.
 * - claude.ai 아티팩트 미리보기: 샌드박스가 직접 다운로드를 막으므로 플랫폼의 downloads 기능을 사용합니다.
 */
async function deliver(blob: Blob) {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (host && typeof host.use === 'function') {
    const downloads = (await host.use('downloads')) as DownloadsApi | null;
    if (!downloads) throw new Error(DOWNLOAD_ERRORS.unavailable);
    try {
      await downloads.save({ filename: cardText.fileName, data: blob });
      return;
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      if (code === 'declined') throw new Cancelled();
      throw new Error(DOWNLOAD_ERRORS[code] ?? `저장 기능 오류(${code || (e as Error)?.message || '알 수 없음'})`);
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cardText.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

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
      await deliver(blob);
      setStatus({ kind: 'done' });
    } catch (err) {
      if (err instanceof Cancelled) {
        setStatus({ kind: 'cancelled' });
        return;
      }
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
          {status.kind === 'cancelled' && '저장을 취소했어요. 다시 누르면 저장할 수 있어요.'}
          {status.kind === 'idle' && '1080×1350 크기 PNG로 저장됩니다.'}
        </p>
      </div>
    </dialog>
  );
}
