/**
 * 작은 마음 공방: 화면 문구, 추천 문구, 카드 테마, 색상을 한곳에서 관리합니다.
 * 연수 중 문구나 색을 바꾸고 싶다면 이 파일만 고치면 됩니다.
 */

export const palette = {
  burgundy: '#41090D',
  burgundyDeep: '#2A0508',
  red: '#B61120',
  redBright: '#D92D38',
  cream: '#FFF1D0',
  creamSoft: '#FFF8E7',
  cookie: '#AC6E3C',
  ink: '#38221B',
} as const;

export const site = {
  name: '작은 마음 공방',
  nav: [
    { label: '카드 만들기', href: '#make' },
    { label: '사용 방법', href: '#how' },
  ],
  hero: {
    display: ['MERRY', 'CHRISTMAS'],
    title: '올해의 고마움을, 작은 카드 한 장에.',
    lead: '마음을 고르고, 문장을 적고, 따뜻한 인사를 전해 보세요.',
    primary: '감사 카드 만들기',
    snow: '눈 내리기',
    eyebrow: 'A little card workshop',
  },
  how: {
    title: '사용 방법',
    lead: '카드 한 장은 세 단계로 완성됩니다.',
    steps: [
      { no: '01', title: '받는 사람 적기', text: '이름이나 호칭을 적으면 카드 맨 위에 바로 나타나요.' },
      { no: '02', title: '문장 고르기', text: '직접 적거나, 동료·학생·가족에게 맞춘 추천 문구에서 골라요.' },
      { no: '03', title: 'PNG로 저장하기', text: '1080×1350 크기 이미지로 저장해 메신저나 학급 게시판에 올려요.' },
    ],
  },
  editor: {
    title: '누구에게 마음을 전할까요?',
    lead: '문구와 배경을 골라 나만의 크리스마스 카드를 만들어 보세요.',
    complete: '카드 완성하기',
  },
  footer: {
    closing: '작은 인사가 따뜻한 하루를 만듭니다.',
    note: '작성한 문구는 서버로 전송하지 않습니다.',
    small: 'Merry little thanks',
  },
};

export const limits = {
  recipient: 12,
  message: 90,
  sender: 12,
  /** 메시지 입력창에서 허용하는 최대 줄 수 */
  messageLines: 6,
};

export const defaults = {
  recipient: '고마운 선생님께',
  message: '함께 웃고 서로 도와준 시간 덕분에\n올해가 더 따뜻했어요.\n행복한 크리스마스 보내세요.',
  sender: '마음을 담아',
};

export type Preset = { id: string; label: string; text: string };

export const presets: Preset[] = [
  {
    id: 'colleague',
    label: '동료에게',
    text: '바쁜 하루에도 함께 웃어 주셔서 고마워요.\n선생님 덕분에 올해가 더 따뜻했어요.',
  },
  {
    id: 'students',
    label: '학생들에게',
    text: '함께 배우고 도전한 너희 덕분에\n선생님의 한 해가 반짝였어.\n따뜻한 겨울 보내렴.',
  },
  {
    id: 'family',
    label: '가족에게',
    text: '늘 곁에서 응원해 줘서 고마워요.\n이번 크리스마스도 함께라서 행복해요.',
  },
];

export type ThemeId = 'check' | 'paper' | 'deep';

export type CardTheme = {
  id: ThemeId;
  label: string;
  /** 카드 위 글자색 */
  ink: string;
  /** 보조 글자(상단 영문, AI 표기) 색 */
  soft: string;
  /** 손글씨 Thank you 색 */
  script: string;
};

export const themes: CardTheme[] = [
  { id: 'check', label: '레드 체크', ink: '#FFF1D0', soft: 'rgba(255,241,208,0.86)', script: '#FFF1D0' },
  { id: 'paper', label: '크림 페이퍼', ink: '#38221B', soft: 'rgba(56,34,27,0.78)', script: '#B61120' },
  { id: 'deep', label: '딥 레드', ink: '#FFF1D0', soft: 'rgba(255,241,208,0.8)', script: '#FFF1D0' },
];

export const cardText = {
  topLabel: 'MERRY CHRISTMAS',
  script: 'Thank you',
  aiMark: '생성형 AI 활용 제작',
  fileName: 'christmas-thanks-card.png',
  width: 1080,
  height: 1350,
};
