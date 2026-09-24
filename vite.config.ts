import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Automatically detect base path:
// - Vercel deployments -> ALWAYS '/' (prevents pathing issues on Vercel preview/prod domains)
// - GitHub Pages deployment workflow -> '/project-123/'
// - Custom override via VITE_BASE_PATH or BASE_PATH
const resolveBase = () => {
  // Vercel build environment flags
  if (process.env.VERCEL || process.env.NOW_BUILDER || process.env.VERCEL_ENV) {
    return '/';
  }
  // GitHub Actions (GitHub Pages deployment for project-123)
  if (process.env.GITHUB_ACTIONS) {
    const ghBase = process.env.BASE_PATH || process.env.VITE_BASE_PATH || '/project-123/';
    return ghBase.endsWith('/') ? ghBase : `${ghBase}/`;
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
