import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 웹폰트는 모두 프로젝트에 포함(self-host)되어 외부 요청 없이 동작합니다.
import '@fontsource/italiana/400.css';
import '@fontsource/pinyon-script/400.css';
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
