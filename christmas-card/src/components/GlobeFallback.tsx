import { useState } from 'react';
import { COOKIE_PATH, ICING, bowWings, smilePoints, type Pt } from '../lib/cookieShape';

const line = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');

/** 3D를 쓸 수 없을 때(또는 불러오는 동안) 보이는 정적 스노볼 그림 */
export function GlobeFallback({ burstKey }: { burstKey: number }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <div className="globe-still">
      <svg viewBox="0 0 400 460" role="img" aria-label="진저브레드 쿠키가 들어 있는 스노볼">
        <defs>
          <radialGradient id="gf-glass" cx="50%" cy="45%" r="55%">
            <stop offset="70%" stopColor="#ffe9dc" stopOpacity="0.05" />
            <stop offset="96%" stopColor="#fff3e6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fff3e6" stopOpacity="0.7" />
          </radialGradient>
          <linearGradient id="gf-cookie" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#C7854B" />
            <stop offset="1" stopColor="#99592C" />
          </linearGradient>
          <linearGradient id="gf-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6E141B" />
            <stop offset="1" stopColor="#3E080C" />
          </linearGradient>
          <clipPath id="gf-clip">
            <circle cx="200" cy="200" r="168" />
          </clipPath>
        </defs>
        <path d="M58 330 Q58 318 72 316 L328 316 Q342 318 342 330 L356 420 Q356 440 336 440 L64 440 Q44 440 44 420 Z" fill="url(#gf-base)" />
        <rect x="52" y="388" width="296" height="6" fill="#F2DDB4" opacity="0.85" />
        <g clipPath="url(#gf-clip)">
          <ellipse cx="200" cy="330" rx="170" ry="52" fill="#FFF6EA" />
          <g fill="#F3E3C6">
            <path d="M95 300 L120 230 L145 300 Z" />
            <path d="M101 262 L120 205 L139 262 Z" />
            <path d="M108 230 L120 190 L132 230 Z" />
            <path d="M268 300 L286 252 L304 300 Z" />
            <path d="M273 274 L286 232 L299 274 Z" />
          </g>
          <circle cx="120" cy="186" r="6" fill="#F7C66A" />
          <circle cx="286" cy="229" r="4.5" fill="#F7C66A" />
          {imgOk ? (
            <image
              href={import.meta.env.BASE_URL + 'cookie-card.png'}
              x="112"
              y="102"
              width="176"
              height="204"
              preserveAspectRatio="xMidYMid meet"
              onError={() => setImgOk(false)}
            />
          ) : (
          <g transform="translate(200 214) rotate(-8) scale(0.92) translate(-100 -120)">
            <path d={COOKIE_PATH} fill="#7C4520" transform="translate(0 5)" />
            <path d={COOKIE_PATH} fill="url(#gf-cookie)" />
            <g fill="none" stroke="#FFF5E4" strokeWidth={ICING.lineW} strokeLinecap="round" strokeLinejoin="round">
              <path d={line(smilePoints())} />
              {ICING.zigzags.map((z, i) => (
                <path key={i} d={line(z)} />
              ))}
            </g>
            <g fill="#FFF5E4">
              {[...ICING.eyes, ...ICING.buttons].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i < 2 ? ICING.eyeR : ICING.buttonR} />
              ))}
            </g>
            <g fill="#C21B28">
              {bowWings().map((w, i) => (
                <path key={i} d={`${line(w)} Z`} />
              ))}
              <circle cx={ICING.bow.c[0]} cy={ICING.bow.c[1]} r="4.6" />
            </g>
          </g>
          )}
          <g key={burstKey} className={burstKey ? 'still-snow is-on' : 'still-snow'} fill="#fff">
            {Array.from({ length: 26 }, (_, i) => (
              <circle key={i} cx={60 + ((i * 53) % 280)} cy={70 + ((i * 37) % 200)} r={2 + (i % 3)} style={{ animationDelay: `${(i % 7) * 60}ms` }} />
            ))}
          </g>
        </g>
        <circle cx="200" cy="200" r="168" fill="url(#gf-glass)" stroke="#FFF1D0" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M110 110 Q150 62 210 56" stroke="#fff" strokeOpacity="0.55" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
