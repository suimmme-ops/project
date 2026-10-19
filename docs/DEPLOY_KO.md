# 처음부터 따라 하는 Streamlit + Google 로그인 + Firebase 배포

처음이라면 [선생님 시작 안내](TEACHER_START.md)를 순서대로 먼저 읽으세요. 이 문서는 설정의 기술적 세부사항과 오류 해결을 보완합니다.

## 먼저 이해하기

이 앱의 화면과 실행 서버는 **Streamlit Community Cloud**, 학생 신원 확인은 **Google OIDC(Streamlit 내장 로그인)**, 영구 저장은 **Firebase Cloud Firestore**가 담당합니다. Firebase Hosting으로 배포하는 앱이 아닙니다. 이 구조에서는 Firebase Authentication을 별도로 활성화하거나 학생에게 Firebase 계정을 만들게 하지 않습니다. 학생은 Google 계정으로 로그인합니다.

기본 코드에는 교사의 실제 비밀번호·비밀 키가 들어 있지 않습니다. 설정이 없으면 ‘체험 모드’가 열립니다. 체험에서는 현재 접속 세션에만 기록을 보관하며 학생 실제 제출로 취급하지 않습니다. Google 로그인과 기기 간 저장을 실제로 사용하려면 아래 설정을 완료해야 합니다.

## 1. GitHub에 코드 준비

1. 제공된 저장소 `suimmme-ops/project`를 사용합니다.
2. 저장소 최상위에 `streamlit_app.py`, `requirements.txt`, `climate_app`, `assets`, `data`, `.streamlit/config.toml`이 있는지 확인합니다.
3. `.streamlit/secrets.toml.example`은 양식이라 공개해도 되지만 **실제 `secrets.toml`과 서비스 계정 JSON은 절대 커밋하지 않습니다.**
4. 변경 사항이 별도 브랜치/PR로 제공되었다면 파일을 검토하고 main에 병합합니다. main이 배포 대상으로 선택되어 있는 기존 앱은 병합 뒤 자동 재배포될 수 있습니다.

## 2. 일단 Streamlit 주소부터 만들기

1. [Streamlit Community Cloud](https://share.streamlit.io/)에 GitHub 계정으로 로그인합니다.
2. **Create app → Deploy a public app from GitHub**를 선택합니다. 비공개 저장소는 계정과 권한에 따라 선택 방식이 달라질 수 있습니다.
3. Repository: `suimmme-ops/project`, Branch: 구현 브랜치 또는 병합 후 `main`, Main file path: `streamlit_app.py`.
4. Advanced settings의 Python은 **3.11 또는 3.12**를 선택합니다.
5. 원하는 앱 주소를 정하고 Deploy를 누릅니다. 예: `my-climate-lab.streamlit.app`.
6. 이 시점에는 비밀 설정이 없으므로 체험 화면이 보입니다. 이 주소를 기록해 둡니다. 아래에서는 `https://YOUR-APP.streamlit.app`을 실제 주소로 바꿔 쓰세요.

배포 버튼 클릭과 계정 연결은 소유자 계정에서 수행해야 합니다. 이 문서는 실제 배포 완료를 의미하지 않습니다.

## 3. Firebase 프로젝트와 데이터베이스 만들기

1. [Firebase Console](https://console.firebase.google.com/) → **프로젝트 만들기**.
2. 이름 예: `climate-explorers-class`. Analytics는 이 앱에 필수가 아닙니다.
3. 프로젝트 왼쪽 **Build → Firestore Database → Create database**.
4. **Standard edition / Native mode**를 사용하고 **프로덕션 모드**로 시작합니다. 테스트 모드를 선택하지 마세요.
5. 데이터베이스 ID는 **`(default)`**로 만듭니다. 지역은 한국 이용자가 많다면 가능한 가까운 지역(예: `asia-northeast3`, 서울)을 선택합니다. 지역은 나중에 쉽게 바꾸기 어려우므로 확인합니다.
6. Rules 탭에서 저장소의 `firestore.rules` 내용을 붙여 넣고 **Publish**합니다. 내용은 브라우저의 모든 직접 읽기·쓰기를 거부합니다.
7. 별도 복합 인덱스는 필요하지 않습니다. 앱에서 기본 단일 필드 검색만 사용합니다.

Firestore의 무료 할당량과 요금 정책은 콘솔에서 확인하세요. 수업 규모에서는 사용량 탭을 확인하며 운영할 수 있습니다.

## 4. Firebase 서버 키 만들기

1. Firebase Console의 톱니바퀴 **Project settings → Service accounts**.
2. Firebase Admin SDK에서 **Generate new private key**를 선택합니다.
3. JSON 파일이 컴퓨터에 내려받아집니다. 이 파일은 서버의 비밀 키입니다. 학생과 공유하거나 GitHub에 올리지 않습니다.
4. JSON에 있는 `project_id`, `private_key_id`, `private_key`, `client_email`, `client_id`, `client_x509_cert_url` 값을 6단계의 Streamlit Secrets에 옮깁니다.
5. 서비스 계정에 데이터베이스 접근 권한이 없다는 오류가 나면 Google Cloud IAM에서 해당 서버 계정에 `Cloud Datastore User` 등 필요한 데이터 접근 권한이 있는지 관리자와 확인합니다. 서비스 계정에 Owner 역할을 추가하는 방식으로 해결하지 마세요.

Admin SDK는 Firestore Rules를 우회합니다. 그래서 이 코드의 서버가 로그인된 Google 신원, 교사 허용 목록, 학급 소유권, 학생 멤버십을 매 요청마다 검사합니다.

## 5. Google 로그인 키 만들기

1. Firebase와 연결된 동일한 프로젝트를 [Google Cloud Console](https://console.cloud.google.com/)에서 선택합니다.
2. **Google Auth Platform**(또는 APIs & Services → OAuth consent screen)으로 이동합니다.
3. 앱 이름과 지원 이메일을 입력합니다. 대상 사용자는 학교 조직 내부만 사용한다면 **Internal**, 개인 계정도 참여한다면 **External**을 검토합니다. 학교 Workspace 정책에 따라 관리자의 승인이 필요할 수 있습니다.
4. 수업 테스트 단계라면 Testing 상태로 두고 **교사와 테스트 학생 이메일을 Test users에 추가**합니다. 테스트 사용자 제한 때문에 로그인되지 않으면 이 설정을 먼저 확인합니다. 실제 학급 전체 운영 전에는 대상 사용자·게시 상태·조직 정책을 확인합니다.
5. Data Access의 범위는 로그인에 필요한 `openid`, `email`, `profile`만 사용합니다. Drive, Gmail 접근 권한은 필요하지 않습니다.
6. **Clients → Create client → Web application**을 선택합니다.
7. Authorized redirect URIs에 정확하게 다음 주소를 추가합니다.

   ```text
   https://YOUR-APP.streamlit.app/oauth2callback
   ```

8. 로컬 테스트도 하려면 다음을 별도로 추가합니다.

   ```text
   http://localhost:8501/oauth2callback
   ```

9. Client ID와 Client secret을 복사해 비밀 설정에 넣습니다. 앱 주소를 바꾸면 Google redirect URI와 Streamlit `redirect_uri` 둘 다 바꿔야 합니다.

이 앱은 팝업을 iframe에 넣지 않고 Streamlit의 정식 OIDC 로그인 흐름을 사용합니다. Firebase 웹 SDK용 `apiKey`, `authDomain`을 넣는 구조가 아닙니다.

## 6. Streamlit Secrets 입력

1. Streamlit 앱의 **Manage app → Settings → Secrets**를 엽니다.
2. 저장소의 `.streamlit/secrets.toml.example` 내용을 붙여 넣습니다.
3. `redirect_uri`를 2단계의 실제 앱 주소에 맞춥니다.
4. `client_id`, `client_secret`은 5단계의 **Google OAuth** 값입니다.
5. `cookie_secret`은 충분히 긴 무작위 값으로 만듭니다. 컴퓨터 터미널에서 다음 명령을 실행하면 됩니다.

   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

6. `[app] teacher_emails`에 교사가 로그인할 Google 이메일을 정확히 입력합니다. 이 목록에 없는 학생 계정은 교사 화면을 열어도 실제 학급 자료를 조회할 수 없습니다.
7. `[firebase]`의 값은 4단계 JSON을 사용합니다. JSON의 `client_id`와 Google OAuth의 `client_id`는 다른 값입니다. 서로 바꾸지 마세요.
8. `private_key`는 `-----BEGIN PRIVATE KEY-----`부터 `-----END PRIVATE KEY-----`까지 모두 포함합니다. 예시처럼 큰따옴표 3개로 감싼 여러 줄 문자열로 넣습니다. JSON의 `\n`은 실제 줄바꿈으로 바꿔 붙여 넣으면 이해하기 쉽습니다. 코드에서도 문자 `\n`을 줄바꿈으로 처리합니다.
9. 저장한 뒤 앱을 Reboot합니다. 로그인 버튼이 활성화되는지 확인합니다.

비밀 값은 채팅에 붙여 넣지 말고 Streamlit Secrets에 직접 입력하세요. 키를 공개 저장소에 올렸다면 파일을 지우는 것만으로 해결되지 않습니다. 해당 키를 폐기하고 새 키를 만들어야 합니다.

## 7. 교사와 학생으로 한 번씩 확인

1. 교사 Google 계정으로 로그인합니다. 왼쪽 **교사 대시보드** → **새 학급 만들기**.
2. 학급 이름을 입력하면 8자리 참여 코드가 표시됩니다. 코드는 한 번 표시되므로 교사가 따로 기록합니다. 서버에는 코드의 SHA-256 해시만 저장합니다.
3. 시크릿 창/다른 브라우저에서 테스트 학생 Google 계정으로 로그인합니다.
4. 교사가 알려준 코드와 학습 이름(번호·별명 사용 가능)을 입력합니다.
5. Chapter 2 그래프 슬라이더를 움직이고 근거를 담은 뒤, 문항 하나를 작성합니다. **학습 기록 저장** 버튼을 누릅니다.
6. 창을 닫고 다시 로그인해 기록이 불러와지는지 확인합니다. 앱은 명시적인 저장 버튼을 사용하며 타이핑만으로 서버에 자동 저장하지 않습니다.
7. Chapter 4에서 미래 글 80자 이상, 근거 1개 이상, 확실하지 않은 점을 입력해 제출합니다.
8. 교사 화면에서 **제출 현황 새로고침**을 누릅니다. 제출본·근거·모든 학습 문항·CSV를 확인하고 피드백을 저장합니다.
9. 학생은 다시 접속해 탐구 노트에서 피드백을 확인합니다. 같은 접속 중 새 피드백을 보려면 탐구 노트의 피드백 새로고침을 사용합니다.
10. 학생이 제출 후 글을 고치고 **초안 저장**만 한 경우, 교사는 기존 마지막 제출본을 봅니다. 다시 제출해야 제출본이 갱신됩니다.
11. 다른 학생의 기록이나 다른 교사의 학급에 접근할 수 없는지 검증합니다. UI의 메뉴 선택 자체가 교사 권한을 부여하지 않습니다.

## 8. 데이터 구조

```text
classes/{classId}                     학급명, 교사 uid
classes/{classId}/members/{uid}       학습 이름, 참여 시간
classes/{classId}/work/{uid}          학습 답변·근거·제출 스냅샷·피드백
join_codes/{sha256(code)}             학급 참여 코드의 해시와 학급 id
users/{uid}                          현재 학급 id
```

`uid`는 Google의 계정 고유 식별자 `sub`를 서버에서 해시한 값입니다. 학생 이메일은 학습 기록에 저장하지 않습니다. Google 로그인 세션은 이메일·표시 이름을 사용하고, 교사 허용 목록 비교에는 확인된 이메일을 사용합니다. Firestore 기록은 학교의 보관 방침에 따라 교사가 콘솔에서 관리하세요. 이 버전은 학생 1명당 현재 학급 1개를 사용하는 구조입니다. 학급 이동·코드 재발급·탈퇴·일괄 삭제 UI는 포함하지 않습니다.

## 9. 오류를 만났을 때

|현상|먼저 확인할 것|
|---|---|
|Google 로그인 버튼 비활성|Secrets의 `[auth] client_id`, `[firebase] project_id`|
|`redirect_uri_mismatch`|Google OAuth에 등록한 URI와 Secrets URI의 도메인·경로 일치|
|테스트 사용자만 접근 가능|Google Auth Platform의 Audience / Test users|
|교사인데 학급 화면이 안 열림|`teacher_emails`와 로그인 이메일 일치|
|저장소 연결 실패|서비스 계정의 project_id·private_key·IAM, `(default)` Firestore 존재|
|앱 실행 실패|Manage app 로그에서 requirements 설치·Python 버전 확인|
|체험 기록 사라짐|체험은 실제 저장이 아님. Google 로그인 후 저장하거나 HTML 다운로드|
|학생 이름만 있고 제출 글이 없음|초안 작성·저장과 최종 제출을 구분|
|한글 CSV가 깨짐|앱 CSV는 UTF-8 BOM 포함. Excel의 데이터 → 텍스트/CSV 가져오기|

## 로컬 실행

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# 필요할 때만: 예시를 .streamlit/secrets.toml로 복사하고 실제 값 입력
streamlit run streamlit_app.py
```

Windows에서는 가상환경 실행 명령을 `.venv\Scripts\activate`로 바꿉니다. 로컬 Secrets의 redirect URI는 `http://localhost:8501/oauth2callback`이어야 합니다.
