import { execSync } from 'child_process';

console.log('🚀 [Build] Starting production build process...');

try {
  // 1. Build Vite frontend bundle
  console.log('📦 [Build] Building Vite frontend...');
  execSync('npx vite build', { stdio: 'inherit' });

  // 2. Build Node.js backend bundle unless VERCEL deployment
  if (!process.env.VERCEL) {
    console.log('⚙️ [Build] Building server backend (esbuild)...');
    execSync('npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs', { stdio: 'inherit' });
  }

  console.log('✅ [Build] Production build completed successfully!');
} catch (error) {
  console.error('❌ [Build] Build failed with error:', error);
  process.exit(1);
}
