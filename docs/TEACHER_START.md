# 선생님이 지금부터 할 일 · 처음 사용하는 분을 위한 순서 안내

이 문서는 **코드를 다시 작성하지 않고** 이미 만들어진 앱을 인터넷에 올리고, 학생의 글을 실제로 모아 수업하는 방법을 안내합니다.

현재 코드는 GitHub의 `codex/climate-explorers` 브랜치에 있습니다. [변경 사항 확인](https://github.com/suimmme-ops/project/pull/1) · [전체 파일](https://github.com/suimmme-ops/project/tree/codex/climate-explorers)

**지금 되는 것:** 로그인 없이 체험, 모든 슬라이더·문항·글쓰기, 현재 접속 중 기록, 탐구 노트 다운로드. **설정 후 되는 것:** Google 로그인, 기기 간 기록 불러오기, 학생 실제 제출, 담당 교사의 수합·피드백. 이 문서를 제공했다는 사실만으로 실제 배포나 계정 연결이 완료된 것은 아닙니다.

## 0. 순서만 먼저 보기

|순서|선생님이 할 일|끝났다는 표시|
|---|---|---|
|1|GitHub에서 새 코드가 있는 브랜치 확인|`static/climate-garden.png`와 `streamlit_app.py`가 보임|
|2|Streamlit에서 앱 배포|인터넷 주소에서 새 디자인의 첫 화면이 열림|
|3|Firebase에서 저장 공간과 서버 키 생성|Firestore `(default)`와 서비스 계정 JSON 준비|
|4|Google 로그인용 앱 등록|OAuth Client ID·Client secret 준비|
|5|Streamlit Secrets에 값 넣기|Google 로그인 버튼이 활성화됨|
|6|교사 로그인 후 학급 생성|8자리 학급 코드가 나옴|
|7|테스트 학생으로 저장·제출 시험|교사 대시보드에서 글을 확인함|
|8|수업 진행 후 결과물 보관|학생 탐구 노트·교사 CSV·피드백 확보|

처음에는 2번까지만 해도 디자인과 학습 활동을 확인할 수 있습니다. **실제 학생 결과물을 수합하기 전에는 반드시 3~7번까지 완료**해 주세요.

## 1. GitHub에서 새 코드 확인하기

1. [저장소](https://github.com/suimmme-ops/project)를 열고 로그인합니다.
2. 파일 목록 위의 브랜치 선택 버튼을 누릅니다. 처음에는 `main`이라고 보일 수 있습니다.
3. 검색 칸에 `codex/climate-explorers`를 입력해 선택합니다.
4. `streamlit_app.py`, `requirements.txt`, `assets`, `static`, `climate_app`, `data`, `docs`가 보이는지 확인합니다.
5. `static` 안의 `climate-garden.png`를 열면 새 입체 지구·식물·캐릭터 그림을 볼 수 있습니다.

**브랜치란?** 원래 코드 옆에 따로 준비한 새 버전입니다. 지금은 새 버전을 검토할 수 있도록 main과 분리해 두었습니다. 아래 배포에서 이 브랜치를 직접 선택하면 합치지 않고도 실행할 수 있습니다.

main으로 정리하려면 나중에 PR #1을 검토하고 Draft를 Ready for review로 바꾼 뒤 병합할 수 있습니다. 이미 main을 사용하는 Streamlit 앱이 있으면 병합 후 자동 업데이트될 수 있으므로, 먼저 새 브랜치 배포로 확인하는 편이 쉽습니다.

## 2. Streamlit에 올리기 · 먼저 주소 만들기

1. [Streamlit Community Cloud](https://share.streamlit.io/)를 엽니다.
2. GitHub 계정으로 로그인합니다. GitHub 연결 허용 화면이 나오면 해당 저장소에 접근할 수 있도록 연결합니다.
3. **Create app**을 누르고 GitHub 저장소에서 배포하는 방식을 선택합니다.
4. 다음 항목을 입력합니다.

   |화면 항목|입력할 내용|
   |---|---|
   |Repository|`suimmme-ops/project`|
   |Branch|`codex/climate-explorers`|
   |Main file path|`streamlit_app.py`|
   |Python version|3.11 또는 3.12|
   |App URL|원하는 영어 앱 이름. 예: `suim-climate-lab`|

5. **Deploy**를 누릅니다. 설치가 끝나면 웹앱이 열립니다.
6. 주소를 메모합니다. 예를 들어 이름이 `suim-climate-lab`이면 보통 `https://suim-climate-lab.streamlit.app`입니다. 실제로 발급된 주소를 사용해야 합니다.
7. **로그인 없이 먼저 둘러보기**를 누릅니다. 4개 챕터, 그래프 슬라이더, 글쓰기 화면을 확인합니다.
8. 휴대폰에서도 같은 주소를 열어 봅니다. 작은 화면에서는 왼쪽 위 화살표로 메뉴를 열 수 있습니다.

**성공 확인:** 새 입체 식물·지구 그림과 새싹 캐릭터가 보이면 새 버전이 실행된 것입니다. 예전 GDP 화면이 나오면 Branch나 Main file path가 잘못된 것입니다.

이미 같은 앱을 배포했다면 무조건 새 앱을 만들 필요는 없습니다. 기존 앱의 배포 저장소·브랜치를 확인하고, 새 브랜치로 바꿀 수 있는지 설정을 확인하세요. 설정 변경이 어렵다면 새 앱을 만들고 먼저 시험합니다. 로그인 설정에는 최종적으로 사용할 주소 하나를 정해 넣습니다.

## 3. Firebase에 학생 기록 보관함 만들기

**Firebase는 무엇인가요?** 학생이 쓴 글을 인터넷에 보관하는 서비스입니다. 이 앱에서는 Firebase의 **Firestore Database**를 사용합니다. 웹사이트 자체를 Firebase에 올리는 것이 아닙니다.

1. [Firebase Console](https://console.firebase.google.com/)에 교사용 Google 계정으로 로그인합니다.
2. **프로젝트 만들기**를 누릅니다. 이름은 예를 들어 `climate-explorers-class`로 정합니다.
3. Analytics는 앱 실행에 필요하지 않습니다. 필요 없다면 사용하지 않아도 됩니다.
4. 프로젝트 화면의 **Build → Firestore Database**로 이동합니다.
5. **Create database**를 누르고 Standard edition / Native mode, 데이터베이스 ID **`(default)`**, **프로덕션 모드**를 선택합니다. 화면의 용어는 콘솔 개편에 따라 조금 다를 수 있습니다.
6. 지역은 사용 환경에 맞게 선택합니다. 한국 수업이면 지원되는 가까운 지역(예: 서울 `asia-northeast3`)을 고려합니다.
7. 데이터베이스가 만들어지면 **Rules** 탭을 엽니다.
8. 다음 전체 내용을 붙여 넣고 **Publish**합니다.

   ```text
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

**왜 모두 false인가요?** 이 앱은 학생 브라우저가 직접 데이터베이스를 열지 않고, 로그인과 학급 권한을 검사한 Streamlit 서버를 통해 저장합니다. 서버용 Admin SDK에는 위 규칙이 적용되지 않으므로, 코드 안에서 권한을 확인합니다. 규칙을 모두 true로 바꿀 필요가 없습니다.

Firestore의 요금제와 무료 사용량은 현재 콘솔에서 확인하세요. 무조건 비용이 전혀 발생하지 않는다고 보장하는 구조는 아닙니다. 공개 자료나 기존 학생 기록이 들어 있는 다른 프로젝트의 규칙을 덮어쓰지 말고, 이 수업 앱용 프로젝트에서 설정하세요.

### 서버가 보관함에 접속할 열쇠 받기

1. 프로젝트 톱니바퀴 → **Project settings → Service accounts**로 이동합니다.
2. **Generate new private key**를 누릅니다.
3. JSON 파일이 내려받아집니다. 교사 컴퓨터의 안전한 위치에 보관합니다.
4. 이 파일을 학생에게 배포하거나 GitHub 파일 목록에 업로드하지 않습니다. 뒤에서 Streamlit Secrets에 필요한 값만 넣습니다.
5. JSON을 메모장이나 텍스트 편집기로 열어 봅니다. `project_id`, `private_key`, `client_email` 등의 항목이 있는지 확인합니다.

**성공 확인:** Firestore `(default)`가 만들어졌고 서버 키 JSON을 내려받았다면 3단계가 끝났습니다. 이 구조에서는 Firebase Authentication이나 Firebase Hosting을 별도로 켜지 않습니다.

## 4. Google 로그인 버튼에 연결할 앱 등록하기

**Google 로그인 설정은 왜 또 하나요?** Firebase의 서버 키는 ‘기록 보관함 열쇠’이고, Google OAuth 키는 ‘로그인 이용증’입니다. 역할이 달라 두 가지가 필요합니다.

1. [Google Cloud Console](https://console.cloud.google.com/)을 엽니다.
2. 화면 위 프로젝트 선택에서 **3단계 Firebase와 연결된 같은 프로젝트**를 고릅니다.
3. **Google Auth Platform**으로 이동합니다. 화면에 따라 **APIs & Services → OAuth consent screen**으로 보일 수 있습니다.
4. 앱 이름(예: 기후 탐험대), 지원 이메일, 개발자 연락 이메일을 입력합니다.
5. 사용자를 정합니다. 학교 조직 내부만 사용하고 Internal을 선택할 수 있으면 학교 정책에 맞춰 사용합니다. 개인 Gmail도 참여한다면 External을 검토합니다.
6. 시험 운영은 Testing으로 둘 수 있습니다. 이 경우 Audience / Test users에서 **교사 계정과 테스트 학생 계정**을 추가합니다.
7. 필요한 범위는 `openid`, `email`, `profile`입니다. Gmail이나 Google Drive 자료를 읽는 권한은 필요하지 않습니다.
8. **Clients → Create client → Web application**을 선택합니다.
9. **Authorized redirect URIs**에 실제 앱 주소 뒤 `/oauth2callback`을 붙여 입력합니다.

   ```text
   https://suim-climate-lab.streamlit.app/oauth2callback
   ```

   위 주소는 예시입니다. **2단계에서 본인에게 발급된 앱 주소로 바꿉니다.**

10. 저장 후 **Client ID**와 **Client secret**을 복사해 본인만 보는 곳에 보관합니다.

**성공 확인:** Google OAuth의 Client ID와 Client secret이 준비되면 4단계가 끝났습니다. 학교 학생 계정에서 외부 앱 로그인이 제한되어 있으면 학교 Google Workspace 관리자와 이 앱의 OAuth 허용 여부를 확인해야 합니다. 실제 학급 참여 계정으로 미리 시험하세요.

## 5. Streamlit에 열쇠 입력하기

1. 배포된 Streamlit 앱에서 **Manage app → Settings → Secrets**를 엽니다. 메뉴는 앱 관리 화면에 있을 수 있습니다.
2. GitHub의 [입력 양식](https://github.com/suimmme-ops/project/blob/codex/climate-explorers/.streamlit/secrets.toml.example)을 엽니다.
3. 양식 전체를 Secrets 입력 칸으로 복사합니다. 설명용 예시 값을 본인의 실제 값으로 바꿉니다.
4. 아래 표를 보며 하나씩 맞춥니다.

   |Secrets 위치|어디서 가져오는가|주의할 점|
   |---|---|---|
   |`[auth] redirect_uri`|2단계 앱 주소 + `/oauth2callback`|4단계 Google 등록 주소와 같아야 함|
   |`[auth] client_id`|4단계 Google OAuth Client ID|끝에 `.apps.googleusercontent.com`이 붙는 값|
   |`[auth] client_secret`|4단계 Google OAuth Client secret|Firebase JSON의 값이 아님|
   |`[auth] cookie_secret`|새 무작위 비밀 문자열|충분히 긴 무작위 값 사용|
   |`[app] teacher_emails`|교사가 로그인할 Google 이메일|이 목록의 계정만 실제 교사 기능 사용|
   |`[firebase]` 항목들|3단계 서버 키 JSON|JSON 각 이름에 맞춰 복사|

5. `cookie_secret`은 비밀번호 관리 도구에서 긴 무작위 문자열을 생성하거나, Python이 설치된 컴퓨터에서 아래 명령으로 64자리 값을 만들 수 있습니다. 명령의 출력값을 본인의 Secrets에 넣습니다.

   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

6. `private_key`는 `-----BEGIN PRIVATE KEY-----`부터 `-----END PRIVATE KEY-----`까지 모두 포함합니다. 예시 양식의 **큰따옴표 세 개**를 유지하고 여러 줄로 붙입니다. JSON의 `\n`은 줄바꿈을 뜻합니다. 코드에서도 이 형태를 처리합니다.
7. `[auth] client_id`와 `[firebase] client_id`는 이름이 같아도 다른 값입니다. 전자는 Google OAuth, 후자는 JSON의 값을 넣습니다.
8. 저장하고 앱을 Reboot합니다.
9. **Google로 시작하기** 버튼이 활성화되었는지 확인합니다. 버튼 활성화는 설정 일부가 존재한다는 표시이며, 실제 로그인·저장 성공 여부는 다음 단계에서 확인합니다.

비밀 값은 채팅으로 보낼 필요가 없습니다. **선생님 계정의 Streamlit Secrets에 직접 입력**합니다. 키를 GitHub에 잘못 올렸다면 해당 키를 폐기하고 새 키를 발급한 뒤 Secrets를 바꿉니다.

## 6. 교사 계정으로 학급 만들기

1. 앱 첫 화면에서 **Google로 시작하기**를 누릅니다.
2. `[app] teacher_emails`에 넣었던 정확한 계정으로 로그인합니다.
3. 왼쪽 메뉴의 **교사 대시보드**를 선택합니다.
4. **새 학급 만들기**를 열고 이름을 입력합니다. 예: `6학년 2반 기후 탐험대`.
5. 학급 생성을 누르면 **8자리 코드**가 보입니다. 코드가 표시될 때 따로 기록합니다.
6. 실제 수업 때 학생에게 **앱 주소와 학급 코드**만 안내합니다. 서버 키나 Secrets를 알려 줄 필요는 없습니다.

**교사인데 실제 학급이 안 보이면:** 로그인한 Google 이메일과 Secrets의 `teacher_emails`를 비교합니다. 단순히 왼쪽 메뉴에서 교사 대시보드를 클릭하는 것으로 교사 권한이 생기지는 않습니다.

## 7. 실제 수업 전에 학생 역할로 시험하기

가능하면 교사 계정과 다른 테스트용 Google 계정, 다른 브라우저나 시크릿 창을 사용합니다. 시크릿 창 자체가 다른 계정을 만들어 주는 것은 아닙니다.

1. 테스트 학생으로 Google 로그인합니다.
2. 8자리 학급 코드와 학습 이름을 입력합니다. 학습 이름은 `05번`처럼 번호·별명을 사용할 수 있습니다.
3. 2장 → STEP 1에서 연도 슬라이더를 움직입니다.
4. **이 수치를 근거로 담기**를 누릅니다.
5. 문항 하나에 짧게 답하고 **학습 기록 저장**을 누릅니다.
6. 로그아웃 후 다시 로그인해 답과 근거가 남아 있는지 확인합니다.
7. 4장에서 시나리오와 연도를 정하고 근거를 추가합니다. 2050년 글이면 슬라이더를 2050년에 맞춥니다.
8. 미래 예상 글을 80자 이상 쓰고, ‘확실하지 않은 점’을 입력한 뒤 **선생님께 제출하기**를 누릅니다.
9. 교사 브라우저로 돌아가 **제출 현황 새로고침**을 누릅니다.
10. 학생의 글·근거가 보이는지, CSV가 내려받아지는지 확인합니다.
11. 피드백을 저장합니다. 학생 화면의 **나의 탐구 노트 → 선생님 피드백 새로고침**으로 확인합니다.

**여기까지 성공해야 실제 수업 준비가 끝났다고 판단합니다.** 로컬 체험 화면이 열리는 것과 Google·Firebase 실제 연결이 되는 것은 서로 다른 확인입니다.

## 8. 수업 당일 · 학생에게 이렇게 안내하세요

아래 문장을 화면에 띄워 읽어도 좋습니다.

> ① 앱 주소로 들어가 학교 Google 계정으로 로그인합니다.<br>
> ② 학급 코드와 학습 이름을 입력합니다.<br>
> ③ 선생님이 안내한 챕터에서 슬라이더를 움직여 봅니다.<br>
> ④ 수치·연도·단위를 확인하고 ‘근거 담기’를 누릅니다.<br>
> ⑤ 내 생각을 쓰고 수업이 끝나기 전에 ‘학습 기록 저장’을 누릅니다.<br>
> ⑥ 마지막 시간에는 2050년 이야기를 쓰고 ‘선생님께 제출하기’를 누릅니다.

- **저장:** 작성 중인 기록을 서버에 보관합니다. 타이핑만으로 서버에 자동 저장되지는 않습니다.
- **제출:** 선생님이 읽을 최종본을 보냅니다. 제출 후 고친 글은 다시 제출해야 최종본이 바뀝니다.
- **체험 제출:** 실제 교사 학급에 보내는 기능이 아닙니다. 화면 기능 확인용입니다.
- **탐험 여권:** 문항에 기록이 있는지를 보여 줍니다. 점수나 개념 숙달도를 자동 평가한 결과가 아닙니다.

## 9. 수업 후 결과물 모으기

1. 교사 대시보드에서 담당 학급을 선택합니다.
2. 제출 완료와 작성 중·미작성을 구별해 봅니다.
3. 필요한 학생의 기록을 펼쳐 마지막 제출본과 자료 근거를 읽습니다.
4. ‘수치가 맞는지 → 그 수치가 주장과 연결되는지 → 불확실한 점을 구별하는지’ 순서로 피드백합니다.
5. **전체 학습 기록 CSV 내려받기**로 Excel용 파일을 보관합니다.
6. 학생은 **나의 탐구 노트 → 탐구 노트 내려받기**로 자신의 기록을 보관할 수 있습니다. HTML을 브라우저에서 열고 인쇄 → PDF로 저장할 수 있습니다.
7. 학급 이동·코드 재발급·일괄 삭제 버튼은 현재 버전에 없습니다. 자료 보관·삭제는 학교 방침에 맞게 Firebase Console에서 관리합니다.

## 10. 대학원 과제 제출 준비

제공된 HWP 안내의 제출물은 **웹앱 URL, GitHub URL, 발표자료, 프로젝트 계획안**입니다. 안내문에는 **2026년 10월 26일 18:00** 마감으로 기재되어 있습니다. 변경 여부는 강의 공지를 확인하세요.

- [ ] 웹앱 주소가 다른 기기에서도 열림
- [ ] 제출할 GitHub URL이 실제 새 코드가 있는 브랜치 또는 병합된 main을 가리킴
- [ ] 발표에서 연도 조작 → 근거 담기 → 글 제출 → 교사 수합을 시연할 수 있음
- [ ] 수업 계획안에 대상·목표·차시·평가·페르소나·사용자 스토리를 반영함
- [ ] 공식 성취기준 코드와 문구를 2022 개정 교육과정 원문에서 대조함
- [ ] 원자료 출처와 대체 자료·미검증 범위를 밝혔음
- [ ] 실제 학생 정보가 보이는 화면을 발표에 사용할 때 학교 방침에 따라 가림

[6차시 상세 수업 지도안](LESSON_PLAN.md) · [기술 설정 상세·오류 해결](DEPLOY_KO.md) · [데이터 출처·범위](SOURCES.md)

## 막히면 어디부터 확인하나요?

|문제|가장 먼저 할 일|
|---|---|
|옛 화면이 나옴|Streamlit의 Branch가 `codex/climate-explorers`인지 확인|
|앱이 잠들었다는 화면|Community Cloud에서 앱 깨우기/재시작|
|Google 로그인 비활성|Secrets 양식과 저장 여부 확인|
|`redirect_uri_mismatch`|실제 앱 주소와 `/oauth2callback`이 두 콘솔에서 같은지 확인|
|일부 Google 계정만 로그인 실패|Google Test users와 학교 계정 앱 정책 확인|
|로그인 후 저장소 연결 실패|Firestore `(default)`·서비스 계정 값·IAM 접근 권한 확인|
|내가 교사인데 조회가 안 됨|`teacher_emails`에 로그인한 이메일이 있는지 확인|
|학생 글이 보이지 않음|실제 로그인인지, 같은 학급인지, 제출/저장했는지 확인|
|고친 글이 최종본에 없음|초안 저장 후 다시 제출했는지 확인|
|새 디자인이 일부 잘림|브라우저 확대를 100%로 맞추고 새로고침. 작은 화면은 메뉴 접기|
