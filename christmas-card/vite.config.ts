import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * index.html을 더블클릭(file://)해도 열리도록 모듈 스크립트 대신 일반 스크립트로 내보냅니다.
 * 브라우저는 file:// 에서 type="module" 과 crossorigin 이 붙은 파일을 차단합니다.
 */
function classicScripts(): Plugin {
  return {
    name: 'classic-scripts',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>')
        .replace(/<link rel="stylesheet" crossorigin href=/g, '<link rel="stylesheet" href=')
        .replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
    },
  };
}

export default defineConfig({
  // 상대 경로: Netlify 루트, 하위 폴더, 미리보기, 파일로 열기 어디서든 파일을 찾을 수 있게 합니다.
  base: './',
  plugins: [react(), classicScripts()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
});
