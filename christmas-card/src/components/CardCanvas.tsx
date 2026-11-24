import { useEffect, useRef } from 'react';
import { H, W, drawCard, ensureCardFonts, type CardState } from '../lib/drawCard';
import { themes } from '../data/content';

type Props = { card: CardState; className?: string; scale?: number; label?: string };

export function describeCard(card: CardState) {
  const theme = themes.find((t) => t.id === card.theme)?.label ?? '';
  return `${theme} 배경의 감사 카드. 받는 사람: ${card.recipient || '없음'}. 메시지: ${card.message || '없음'}. 보내는 사람: ${card.sender || '없음'}.${card.cookie ? ' 진저브레드 쿠키 장식 포함.' : ''}`;
}

/** 카드 미리보기. PNG 저장과 같은 그리기 함수를 쓰므로 보이는 그대로 저장됩니다. */
export function CardCanvas({ card, className, scale = 1, label }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const paint = () => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawCard(ctx, card);
    };
    paint();
    let alive = true;
    ensureCardFonts(card)
      .then(() => alive && paint())
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [card, scale]);

  return (
    <canvas
      ref={ref}
      className={className}
      width={Math.round(W * scale)}
      height={Math.round(H * scale)}
      role={label === '' ? undefined : 'img'}
      aria-hidden={label === '' ? true : undefined}
      aria-label={label === '' ? undefined : label ?? describeCard(card)}
    />
  );
}
