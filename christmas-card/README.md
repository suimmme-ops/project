# 작은 마음 공방 · 크리스마스 감사 카드

교사 대상 AI 디자인 연수 시연용 웹사이트입니다.
첫 화면의 스노볼을 감상하고 눈을 흩날린 뒤, 감사 카드를 꾸며 1080×1350 PNG로 저장합니다.
로그인·서버·외부 전송이 없고, 웹폰트와 3D 모델도 모두 프로젝트 안에 들어 있습니다.

## 실행

```bash
cd christmas-card
npm install
npm run dev        # 개발 서버 (http://localhost:5173)
npm run build      # dist/ 에 배포용 결과물 생성
npm run preview    # 빌드 결과 미리보기
```

빌드한 `dist/index.html`은 더블클릭해 파일로 열어도 동작합니다(인터넷 없이 시연 가능).
파일로 열 때는 브라우저가 파일 읽기를 막기 때문에, 3D 모델과 카드용 쿠키 이미지를 `offline-assets.js`(빌드 때 자동 생성)에서 읽습니다.

`?no3d`를 주소 뒤에 붙이면(예: `http://localhost:5173/?no3d`) 3D를 쓸 수 없는 상황을 시연할 수 있습니다.

## Netlify 배포(요청 시)

- 저장소를 연결하고 **Base directory**를 `christmas-card`로 지정합니다.
- 빌드 명령과 게시 폴더는 `netlify.toml`에 들어 있습니다(`npm run build`, `dist`).
- 또는 `npm run build` 후 `dist` 폴더를 Netlify Drop에 끌어다 놓아도 됩니다.

## 고치기 쉬운 곳

| 바꾸고 싶은 것 | 파일 |
| --- | --- |
| 화면 문구, 추천 문구, 글자 수 제한, 카드 테마 이름·글자색 | `src/data/content.ts` |
| 색상·곡률·간격 토큰 | `src/styles.css` 맨 위 `:root` |
| 카드 레이아웃(글자 위치·크기) | `src/lib/drawCard.ts` |
| 스노볼 장면(조명, 눈 입자 수, 소품) | `src/lib/snowGlobe3d.ts` |

## 에셋

- `public/models/gingerbread_cookie.glb`: 제공받은 쿠키 GLB(19.8MB)를 웹용으로 압축한 사본(1.75MB, 텍스처 1024px WebP, meshopt).
  다시 만들기:
  `npx @gltf-transform/cli optimize 원본.glb public/models/gingerbread_cookie.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify false`
- `public/cookie-card.png`: 같은 GLB를 투명 배경으로 렌더링한 정적 이미지. 카드 PNG와 3D 대체 그림에 쓰입니다.
  `npm run dev` 후 `/tools/render-cookie.html`을 열면 다시 렌더링할 수 있습니다(`window.__cookiePng`에 결과 저장).
- GLB를 불러오지 못하면 `src/lib/cookieShape.ts`의 윤곽으로 만든 단순 쿠키 모델이 대신 표시됩니다.
- 글꼴: Italiana(영문 제목), Pinyon Script(카드의 "Thank you" 한 곳), Pretendard(한글). 모두 npm 패키지로 내장했습니다.
