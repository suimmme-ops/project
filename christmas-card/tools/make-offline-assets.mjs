// file:// 로 열 때 쓰는 에셋 묶음(public/offline-assets.js)을 만듭니다.
// 파일로 열면 브라우저가 fetch와 이미지 픽셀 읽기를 막으므로, 쿠키 GLB와 카드용 쿠키 PNG를
// 일반 스크립트 안의 base64 데이터로 넣어 둡니다. 웹 서버(Netlify)에서는 이 파일을 읽지 않습니다.
import { readFileSync, writeFileSync } from 'node:fs';

const glb = readFileSync(new URL('../public/models/gingerbread_cookie.glb', import.meta.url)).toString('base64');
const png = readFileSync(new URL('../public/cookie-card.png', import.meta.url)).toString('base64');
const js = `window.__CARD_OFFLINE__={glb:"${glb}",cookiePng:"data:image/png;base64,${png}"};\n`;
writeFileSync(new URL('../public/offline-assets.js', import.meta.url), js);
console.log(`offline-assets.js ${(js.length / 1024 / 1024).toFixed(2)} MB`);
