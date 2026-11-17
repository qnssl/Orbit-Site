import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base настраивается через VITE_BASE:
//   "/"                — репозиторий username.github.io или локальная разработка
//   "/repository-name/" — project site на GitHub Pages
// В GitHub Actions значение вычисляется автоматически (см. .github/workflows/deploy.yml).
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
