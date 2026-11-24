import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 상대 경로: Netlify 루트, 하위 폴더, 미리보기 어디에 올려도 파일을 찾을 수 있게 합니다.
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
});
