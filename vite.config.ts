import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Automatically detect base path:
// - Vercel deployments -> ALWAYS '/' (prevents pathing issues on Vercel preview/prod domains)
// - GitHub Pages deployment workflow -> dynamically derived from configure-pages or repository name
// - Custom override via VITE_BASE_PATH or BASE_PATH
const resolveBase = () => {
  // Vercel build environment flags
  if (process.env.VERCEL || process.env.NOW_BUILDER || process.env.VERCEL_ENV) {
    return '/';
  }
  // GitHub Actions (GitHub Pages deployment)
  if (process.env.GITHUB_ACTIONS) {
    const rawGhBase = process.env.BASE_PATH || process.env.VITE_BASE_PATH;
    if (rawGhBase && rawGhBase.trim() !== '') {
      return rawGhBase.endsWith('/') ? rawGhBase : `${rawGhBase}/`;
    }
    if (process.env.GITHUB_REPOSITORY) {
      const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
      if (repoName && !repoName.includes('.github.io')) {
        return `/${repoName}/`;
      }
    }
    return './';
  }
  // Explicit override if provided
  if (process.env.VITE_BASE_PATH) {
    const bp = process.env.VITE_BASE_PATH;
    return bp.endsWith('/') ? bp : `${bp}/`;
  }
  if (process.env.BASE_PATH) {
    const bp = process.env.BASE_PATH;
    return bp.endsWith('/') ? bp : `${bp}/`;
  }
  return '/';
};

export default defineConfig({
  base: resolveBase(),
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
          }
        },
      },
    },
  },
});
