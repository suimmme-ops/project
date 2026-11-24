import { COOKIE_BOX, COOKIE_PATH, ICING, bowWings, smilePoints, type Pt } from './cookieShape';

let cookiePath: Path2D | null = null;
function path(): Path2D {
  if (!cookiePath) cookiePath = new Path2D(COOKIE_PATH);
  return cookiePath;
}

/** 굽기 얼룩: 매번 같은 결과가 나오도록 고정 시드 사용 */
function speckles(): Pt[] {
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pts: Pt[] = [];
  for (let i = 0; i < 70; i++) pts.push([20 + rnd() * 160, 15 + rnd() * 215]);
  return pts;
}
const SPECKS = speckles();

function polyline(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

/**
 * 쿠키를 벡터로 그립니다. (cx, cy)는 중심, height는 화면상의 높이, angle은 라디안.
 * 카드 PNG와 미리보기, 정적 대체 그림이 모두 이 함수를 사용합니다.
 */
export function drawCookie(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  height: number,
  angle = -0.16,
  shadow = true,
) {
  const s = height / COOKIE_BOX.h;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(s, s);
  ctx.translate(-COOKIE_BOX.w / 2, -COOKIE_BOX.h / 2);
  const p = path();

  // 그림자와 두께감
  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(30, 6, 4, 0.38)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#7C4520';
    ctx.translate(0, 5);
    ctx.fill(p);
    ctx.restore();
  }
  ctx.save();
  ctx.fillStyle = '#7C4520';
  ctx.translate(0, 4);
  ctx.fill(p);
  ctx.restore();

  // 윗면
  const g = ctx.createRadialGradient(92, 90, 10, 100, 120, 150);
  g.addColorStop(0, '#C7854B');
  g.addColorStop(0.55, '#B0703C');
  g.addColorStop(1, '#93552A');
  ctx.fillStyle = g;
  ctx.fill(p);

  // 가장자리 구운 색
  ctx.save();
  ctx.clip(p);
  ctx.lineWidth = 9;
  ctx.strokeStyle = 'rgba(110, 58, 24, 0.35)';
  ctx.stroke(p);
  ctx.fillStyle = 'rgba(96, 50, 20, 0.28)';
  for (const [x, y] of SPECKS) {
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 아이싱
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const icing = '#FFF5E4';
  const icingShade = 'rgba(120, 70, 40, 0.28)';
  const lines = [smilePoints(), ...ICING.zigzags];
  for (const [color, dy] of [
    [icingShade, 1.4],
    [icing, 0],
  ] as const) {
    ctx.save();
    ctx.translate(0, dy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = ICING.lineW;
    lines.forEach((l) => polyline(ctx, l));
    for (const [x, y] of ICING.eyes) {
      ctx.beginPath();
      ctx.arc(x, y, ICING.eyeR, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const [x, y] of ICING.buttons) {
      ctx.beginPath();
      ctx.arc(x, y, ICING.buttonR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 빨간 나비넥타이
  const wings = bowWings();
  ctx.fillStyle = '#C21B28';
  ctx.strokeStyle = '#8E0F19';
  ctx.lineWidth = 1.5;
  for (const w of wings) {
    ctx.beginPath();
    w.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  const [bx, by] = ICING.bow.c;
  ctx.beginPath();
  ctx.arc(bx, by, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 220, 210, 0.55)';
  for (const hx of [bx - 9, bx + 9]) {
    ctx.beginPath();
    ctx.arc(hx, by - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
