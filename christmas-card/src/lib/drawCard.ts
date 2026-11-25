import { cardText, themes, type ThemeId } from '../data/content';
import { drawCookie } from './drawCookie2d';
import { offlineAssets } from './offline';

export type CardState = {
  recipient: string;
  message: string;
  sender: string;
  theme: ThemeId;
  cookie: boolean;
};

export const W = cardText.width;
export const H = cardText.height;

const KO = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
const SERIF = 'Italiana, "Cormorant Garamond", "Times New Roman", serif';
const SCRIPT = '"Pinyon Script", "Snell Roundhand", "Segoe Script", cursive';

const PAD = 100;
const MSG_TOP = 520;
const MSG_BOTTOM = 950;
const MSG_WIDTH = W - PAD * 2;
const COOKIE_ZONE = { cx: 846, cy: 1104, h: 320 };

/** 제공된 GLB에서 미리 렌더링한 투명 PNG(public/cookie-card.png). 같은 출처라 캔버스 저장이 막히지 않습니다. */
let cookieImg: HTMLImageElement | null = null;
let cookieLoad: Promise<HTMLImageElement | null> | null = null;
export function loadCookieImage(): Promise<HTMLImageElement | null> {
  if (!cookieLoad) {
    cookieLoad = offlineAssets().then((assets) => new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        cookieImg = img;
        resolve(img);
      };
      img.onerror = () => {
        console.warn('[카드] 쿠키 이미지를 불러오지 못해 벡터 쿠키로 그립니다.');
        resolve(null);
      };
      // 파일로 연 경우 data URI를 써야 캔버스 저장(toBlob)이 보안 오류 없이 됩니다.
      img.src = assets?.cookiePng ?? import.meta.env.BASE_URL + 'cookie-card.png';
    }));
  }
  return cookieLoad;
}

/** 카드에 쓰이는 글꼴을 실제 글자 기준으로 불러올 때까지 기다립니다. */
export async function ensureCardFonts(s: CardState): Promise<void> {
  if (s.cookie) await loadCookieImage();
  if (!('fonts' in document)) return;
  const ko = `${s.recipient}${s.message}${s.sender}${cardText.aiMark}`;
  await Promise.all([
    document.fonts.load(`700 58px ${KO}`, ko),
    document.fonts.load(`500 46px ${KO}`, ko),
    document.fonts.load(`600 42px ${KO}`, ko),
    document.fonts.load(`400 46px ${SERIF}`, cardText.topLabel),
    document.fonts.load(`400 150px ${SCRIPT}`, cardText.script),
  ]);
  await document.fonts.ready;
}

function drawBackground(ctx: CanvasRenderingContext2D, theme: ThemeId) {
  if (theme === 'check') {
    ctx.fillStyle = '#B0101F';
    ctx.fillRect(0, 0, W, H);
    const band = 90;
    const step = 180;
    ctx.fillStyle = 'rgba(226, 64, 74, 0.32)';
    for (let x = -band / 2; x < W; x += step) ctx.fillRect(x, 0, band, H);
    for (let y = -band / 2; y < H; y += step) ctx.fillRect(0, y, W, band);
    // 글자 영역이 잘 읽히도록 아주 약한 그늘
    const v = ctx.createRadialGradient(W / 2, H * 0.45, 200, W / 2, H / 2, 900);
    v.addColorStop(0, 'rgba(70, 4, 10, 0.18)');
    v.addColorStop(1, 'rgba(70, 4, 10, 0.32)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  } else if (theme === 'paper') {
    ctx.fillStyle = '#FFF1D0';
    ctx.fillRect(0, 0, W, H);
    let s = 11;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = 'rgba(120, 80, 40, 0.07)';
    for (let i = 0; i < 2600; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    ctx.strokeStyle = 'rgba(182, 17, 32, 0.55)';
    ctx.lineWidth = 3;
    roundRect(ctx, 44, 44, W - 88, H - 88, 40);
    ctx.stroke();
  } else {
    const g = ctx.createRadialGradient(W / 2, H * 0.42, 60, W / 2, H / 2, 950);
    g.addColorStop(0, '#7A1018');
    g.addColorStop(0.6, '#4E0B11');
    g.addColorStop(1, '#33070B');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255, 241, 208, 0.78)';
    ctx.lineWidth = 3;
    roundRect(ctx, 44, 44, W - 88, H - 88, 40);
    ctx.stroke();
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 한국어는 어절 단위로 줄을 바꾸고, 한 어절이 너무 길 때만 글자 단위로 나눕니다. */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(/ +/);
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
        continue;
      }
      if (line) out.push(line);
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
      } else {
        let chunk = '';
        for (const ch of Array.from(word)) {
          if (ctx.measureText(chunk + ch).width > maxWidth && chunk) {
            out.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      }
    }
    out.push(line);
  }
  return out;
}

/** 메시지가 정해진 영역 안에 들어가는 가장 큰 글자 크기(최소 34px)를 찾습니다. */
export function fitMessage(ctx: CanvasRenderingContext2D, text: string) {
  const sizes = [48, 46, 44, 42, 40, 38, 36, 34];
  for (const size of sizes) {
    ctx.font = `500 ${size}px ${KO}`;
    const lh = Math.round(size * 1.58);
    const lines = wrapText(ctx, text, MSG_WIDTH);
    if (lines.length * lh <= MSG_BOTTOM - MSG_TOP || size === sizes[sizes.length - 1]) {
      return { size, lh, lines, fits: lines.length * lh <= MSG_BOTTOM - MSG_TOP };
    }
  }
  throw new Error('unreachable');
}

export function drawCard(ctx: CanvasRenderingContext2D, s: CardState) {
  const theme = themes.find((t) => t.id === s.theme) ?? themes[0];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  drawBackground(ctx, s.theme);

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // 상단 영문 표기
  ctx.fillStyle = theme.soft;
  ctx.font = `400 46px ${SERIF}`;
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '9px';
  ctx.fillText(cardText.topLabel, PAD, 176);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';

  // 손글씨 포인트(사이트 전체에서 이곳 한 곳만 사용)
  ctx.save();
  ctx.translate(PAD - 6, 338);
  ctx.rotate(-0.05);
  ctx.fillStyle = theme.script;
  ctx.font = `400 150px ${SCRIPT}`;
  ctx.fillText(cardText.script, 0, 0);
  ctx.restore();

  // 받는 사람
  ctx.fillStyle = theme.ink;
  const recipient = s.recipient.trim();
  if (recipient) {
    ctx.font = `700 58px ${KO}`;
    ctx.fillText(recipient, PAD, 462);
  }

  // 메시지
  const msg = s.message.replace(/\s+$/, '');
  const fit = fitMessage(ctx, msg);
  ctx.font = `500 ${fit.size}px ${KO}`;
  let y = MSG_TOP + fit.size;
  for (const line of fit.lines) {
    ctx.fillText(line, PAD, y);
    y += fit.lh;
  }

  // 보내는 사람: 메시지 아래, 쿠키 영역의 왼쪽
  const sender = s.sender.trim();
  if (sender) {
    ctx.font = `600 42px ${KO}`;
    const lastBase = MSG_TOP + fit.size + fit.lh * Math.max(fit.lines.length - 1, 0);
    const sy = Math.min(Math.max(lastBase + 92, 900), 1060);
    ctx.fillText(`— ${sender}`, PAD, sy);
  }

  // 쿠키 전용 영역
  if (s.cookie) {
    if (cookieImg) {
      const h = COOKIE_ZONE.h;
      const w = (h * cookieImg.naturalWidth) / cookieImg.naturalHeight;
      ctx.save();
      ctx.translate(COOKIE_ZONE.cx, COOKIE_ZONE.cy);
      ctx.rotate(-0.06);
      ctx.shadowColor = 'rgba(30, 6, 4, 0.35)';
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 12;
      ctx.drawImage(cookieImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      drawCookie(ctx, COOKIE_ZONE.cx, COOKIE_ZONE.cy, COOKIE_ZONE.h, -0.18, true);
    }
  }

  // AI 활용 표기
  ctx.fillStyle = theme.soft;
  ctx.font = `500 26px ${KO}`;
  ctx.fillText(cardText.aiMark, PAD, H - 88);

  ctx.restore();
}

/** 1080×1350 PNG Blob을 만듭니다. 글꼴을 기다린 뒤 새 캔버스에 정적으로 그립니다. */
export async function renderCardPng(s: CardState): Promise<Blob> {
  await ensureCardFonts(s);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이 브라우저에서 캔버스를 만들 수 없습니다.');
  drawCard(ctx, s);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob || blob.size < 1000) throw new Error('이미지 데이터가 비어 있습니다.');
  return blob;
}
