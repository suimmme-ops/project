import { useEffect, useRef, useState } from 'react';
import { GlobeFallback } from './GlobeFallback';
import type { GlobeHandle } from '../lib/snowGlobe3d';

type Props = { burstKey: number; onBurst: () => void };

/** ?no3d 를 주소에 붙이면 3D 실패 상황을 시연·점검할 수 있습니다. */
const force2d = typeof location !== 'undefined' && new URLSearchParams(location.search).has('no3d');

export function Globe({ burstKey, onBurst }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<GlobeHandle | null>(null);
  const [mode, setMode] = useState<'loading' | '3d' | 'still'>(force2d ? 'still' : 'loading');

  useEffect(() => {
    if (force2d) return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../lib/snowGlobe3d');
        if (cancelled || !host.current) return;
        if (!mod.webglAvailable()) throw new Error('WebGL을 지원하지 않습니다.');
        const mobile = window.matchMedia('(max-width: 720px), (pointer: coarse)').matches;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        handle.current = mod.mountSnowGlobe(host.current, {
          mobile,
          reducedMotion,
          modelUrl: import.meta.env.BASE_URL + 'models/gingerbread_cookie.glb',
          // 쿠키까지 준비된 뒤에 정적 그림을 3D로 바꿉니다.
          onCookie: (source) => {
            if (cancelled) return;
            host.current?.parentElement?.setAttribute('data-cookie', source);
            setMode('3d');
          },
          onFail: (reason) => {
            console.warn('[스노볼] 3D 표시를 멈추고 정적 그림으로 바꿉니다:', reason);
            handle.current?.dispose();
            handle.current = null;
            if (!cancelled) setMode('still');
          },
        });
      } catch (err) {
        console.warn('[스노볼] 3D를 불러오지 못해 정적 그림으로 표시합니다:', err);
        if (!cancelled) setMode('still');
      }
    })();
    return () => {
      cancelled = true;
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);

  useEffect(() => {
    if (burstKey) handle.current?.burst();
  }, [burstKey]);

  return (
    <div className="globe" data-mode={mode} onClick={onBurst}>
      <div ref={host} className="globe-gl" aria-hidden="true" />
      {mode !== '3d' && <GlobeFallback burstKey={mode === 'still' ? burstKey : 0} />}
    </div>
  );
}
