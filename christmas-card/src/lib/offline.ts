/**
 * index.html을 파일로 직접 연 경우(file://)의 대체 에셋.
 * 이때만 offline-assets.js를 일반 스크립트로 불러와 GLB와 쿠키 PNG를 base64로 받습니다.
 */
export type OfflineAssets = { glb: string; cookiePng: string };

export const isFileProtocol = typeof location !== 'undefined' && location.protocol === 'file:';

let pending: Promise<OfflineAssets | null> | null = null;

export function offlineAssets(): Promise<OfflineAssets | null> {
  if (!isFileProtocol) return Promise.resolve(null);
  if (!pending) {
    pending = new Promise((resolve) => {
      const w = window as unknown as { __CARD_OFFLINE__?: OfflineAssets };
      if (w.__CARD_OFFLINE__) return resolve(w.__CARD_OFFLINE__);
      const s = document.createElement('script');
      s.src = './offline-assets.js';
      s.onload = () => resolve(w.__CARD_OFFLINE__ ?? null);
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }
  return pending;
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
