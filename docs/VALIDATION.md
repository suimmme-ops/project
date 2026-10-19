# 검증 기록

검증일: 2026-10-19. Python 3.12, Streamlit 1.66.0, Chromium.

## 자동 검증

`python -m pytest -q tests` — 6개 통과.

- 학생: 체험 접속 → 4개 챕터 → STEP 1–4 → 슬라이더 → 근거 담기 → 문항 기록 → 미래 글 조건 충족 → 체험 제출 → 탐구 노트·대시보드·출처 화면.
- 챕터를 오간 뒤 답변 유지.
- 이메일 확인이 없는 신원 차단 및 Google sub 기반 uid 생성.
- 학생의 교사 기능 접근·다른 교사의 학급 접근·학급 미참여 학생 저장 차단.
- 미래 글·근거·불확실성의 제출 조건과 답변 길이 제한.
- 제출 뒤 초안 저장이 마지막 제출 스냅샷을 덮어쓰지 않음.
- 176개 기온 기록·기준 평균·이동평균 초기 결측·2024년 국가별 값·과거 결측을 0으로 바꾸지 않음·공식 시나리오 지점과 보간 확인.

Firestore 검증은 메모리 대역을 사용하는 서버 로직 테스트입니다. 실제 Google 계정·실제 Firebase 왕복 테스트를 뜻하지 않습니다.

`python -m compileall -q streamlit_app.py climate_app` 및 `git diff --check` 통과.

## 브라우저 확인

- Chromium, 1440×1100: Chapter 1·2·4와 국가별 비교 렌더링, JavaScript pageerror 없음, 가로 넘침 없음.
- Chromium, 390×844: 모바일 진입·본문 표시·가로 넘침 없음. 초기 사이드바를 `auto`로 설정해 작은 화면에서 본문을 덮지 않도록 수정.
- 미리보기: [데이터 탐구](previews/data-graph.png), [미래 시나리오](previews/future-graph.png), [모바일](previews/mobile.png).

## 실제 배포 전 소유자 계정에서 확인할 항목

1. Google OAuth 승인 화면·테스트 사용자·callback URI.
2. 교사 허용 목록, 학생 가입, 학급 소유권.
3. Firestore 서비스 계정 IAM 및 서버 저장·재접속 불러오기.
4. 학생 제출 → 교사 수합·CSV → 피드백 → 학생 새로고침.
5. Streamlit Community Cloud 공개 URL에서 실행.
6. 네트워크 허용 후 한국에너지공단 원문 표와 요청 참고 사이트 직접 대조.

위 항목은 외부 계정 설정/접근이 없어 아직 검증하지 않았습니다. 로컬 체험 성공을 실제 배포 완료로 표시하지 않습니다.
