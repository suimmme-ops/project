### 관측 기온 · Chapter 2 STEP 1

- **Met Office Hadley Centre & UEA CRU, HadCRUT5 5.1.0.0 (analysis).** [원자료](https://www.metoffice.gov.uk/hadobs/hadcrut5/)
- 1850–2025년 연평균 기온 편차. 사용자가 제공한 `Climate_Futures_Book.html`의 `DATA` 배열을 변경 없이 CSV로 추출했습니다. 첨부 HTML에는 확인·다운로드 날짜가 2026-10-12로 기재되어 있습니다.
- HTML 작성자가 원래 1961–1990 기준에서 1850–1900 평균값 −0.35736087℃를 빼서 환산한 값입니다. 이번 구현에서는 원본 관측기관 파일과 직접 대조하지 못했습니다. 반올림된 첨부 배열을 사용하며 관측 불확실성 띠는 생략했습니다.
- 10년 이동평균: 해당 연도와 이전 9개 연도의 산술평균. 1859년부터 표시합니다. 파리협정의 장기 온난화 평가와 동일한 지표가 아닙니다.

### CO₂와 온실가스 · Chapter 2

- **Our World in Data, CO₂ and Greenhouse Gas Emissions dataset.** [GitHub 원본 CSV](https://github.com/owid/co2-data/blob/master/owid-co2-data.csv) · [지표별 정의와 원출처](https://github.com/owid/co2-data/blob/master/owid-co2-codebook.csv) · [라이선스 안내](https://github.com/owid/co2-data#license)
- 2026-10-19 다운로드한 1750–2024년 스냅샷. 앱은 지역 합계를 제외한 ISO 국가 및 World 행, 필요한 열만 보관합니다. 결측값은 보간하거나 0으로 바꾸지 않습니다.
- `co2_per_capita`: 화석연료·산업 CO₂의 생산 기준 1인당 연간 배출량(톤/명). 토지 이용 변화 제외. Global Carbon Budget (2025) 기반. [요청된 비교 그래프](https://ourworldindata.org/grapher/co-emissions-per-capita?time=1750..2024&facet=none&country=KOR~GBR)
- `temperature_change_from_ghg`: 인간이 배출한 온실가스의 기온 상승 기여도 추정(℃). 원출처: Jones et al., National contributions to climate change (2025). 관측 기온과 다른 지표이며 에어로졸 냉각 등은 포함하지 않습니다. [요청된 인사이트](https://ourworldindata.org/co2-and-greenhouse-gas-emissions?insight=human-greenhouse-gas-emissions-have-increased-global-average-temperatures#key-insights)
- `total_ghg`: 토지 이용 변화를 포함한 연간 전체 온실가스(백만 톤 CO₂eq). 앱의 전체 순위는 해당 연도에 값이 있는 세 글자 ISO 국가들만을 대상으로 계산합니다. 원출처: Jones et al., National contributions to climate change (2025). 100년 시간지평의 CO₂ 환산값입니다. 다운로드한 `data/owid-codebook.csv`에 정의와 원출처를 함께 보관했습니다.
- **한국에너지공단 요청 표:** [국가별 온실가스 배출량](https://tips.energy.or.kr/statistics/statistics_view0909.do). 현재 실행 환경의 도메인 정책으로 원문을 가져오지 못했습니다. STEP 4의 OWID 자료는 원문 표와 다른 대체 자료로 표시합니다. 순위·포함 범위·연도가 일치한다고 주장하지 않습니다. 원문 접근 후 표와 출처를 검증하여 교체해야 합니다.

### 1.5℃와 극한 고온 · Chapter 3

- **IPCC AR6 WGI (2021), Figure SPM.6.** [원문](https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-6/)
- 산업화 이전(1850–1900) 육지에서 평균 10년에 한 번 발생하던 극한 고온이 1.0 / 1.5 / 2.0 / 4.0℃ 온난화에서 각각 약 2.8 / 4.1 / 5.6 / 9.4회 발생한다는 중심 추정입니다. 표에 없는 수준은 보간하지 않았습니다. 전망 범위는 그림에서 생략했습니다. 특정 지역 폭염 일수에 적용할 수 없습니다.
- 영향 설명은 IPCC AR6 WGI SPM B.2, B.3, B.5의 요지를 초등학생 수준으로 재서술했습니다. 단일 재난의 원인을 기후변화만으로 설명하지 않습니다.

### 미래 시나리오 · Chapter 4

- **IPCC AR6 WGI (2021), Table SPM.1.** [원문](https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/)
- 기온 상승은 1850–1900 대비이며, 수치는 중심 추정과 매우 가능성 높은 범위(90% 이상)입니다.

|경로|2021–2040|2041–2060|2081–2100|
|---|---|---|---|
|SSP1-1.9|1.5 (1.2–1.7)|1.6 (1.2–2.0)|1.4 (1.0–1.8)|
|SSP2-4.5|1.5 (1.2–1.8)|2.0 (1.6–2.5)|2.7 (2.1–3.5)|
|SSP5-8.5|1.6 (1.3–1.9)|2.4 (1.9–3.0)|4.4 (3.3–5.7)|

- 기간 평균을 2030 / 2050 / 2090 지점에 배치했습니다. 점 사이의 선·범위 및 슬라이더 중간 연도 값은 **교육용 선형 보간**입니다. 공식 연도별 예측이 아니며, 2061–2080의 별도 공식 평균을 제공하지 않습니다.
- 생활상은 학생의 조건부 예상입니다. 시나리오가 특정 지역의 침수 위치, 사과 수확량, 사회상을 정량 예측하지 않습니다.

### 수업 구성 참고

- 사용자 제공 PDF `2. 기후변화 데이터 분석하기.pdf`, `자료로 확인하는 기후변화.pdf`: 문항 흐름을 재구성. 학생 이름·필기 답변은 전재하지 않았습니다. STEP 5의 AI 역할극은 이번 요청 범위인 STEP 1–4와 미래 글쓰기로 대체되어 별도 AI 대화 기능을 넣지 않았습니다.
- 사용자 제공 `Climate_Futures_Book.html`: 기온 데이터, 시나리오 및 출처 설명 참고.
- [기존 기후 수업 사이트](https://climate-action-project.netlify.app/) · [온실효과 학습 사이트](https://6-2climate.netlify.app/): 환경 네트워크 제한으로 직접 열람하지 못했습니다. 제공된 학습지와 HTML을 바탕으로 수업을 구성했습니다.
- HWP 과제 안내: 데이터 기반 융합 수업, 학생 조작·탐구, 데이터 출처, 페르소나·사용자 스토리 및 계획안 요구를 확인했습니다. 문서 속 대상 예시(중3)는 사용자 지정 초등 5–6학년으로 재설계했습니다.

### 화면과 접근성

일러스트는 앱 CSS로 만든 개념 표현입니다. 그래프는 Plotly이며 학습 조작은 Streamlit 슬라이더로 제공합니다. 큰 수치 카드·단위·색상 이외의 경로 이름과 선 스타일을 함께 사용합니다. Noto Sans KR 글꼴은 Google Fonts가 연결되면 표시하며, 연결되지 않아도 기본 글꼴로 모든 기능을 이용할 수 있습니다.
