import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cwd } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '');

  return {
    base: '/',
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['recharts'],
            map: ['leaflet', 'react-leaflet'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || ''),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || env.VITE_SUPABASE_URL || ''),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || env.VITE_SUPABASE_KEY || ''),
      'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || env.VITE_RESEND_API_KEY || ''),
      'process.env.CONTACT_EMAIL': JSON.stringify(env.CONTACT_EMAIL || 'contact@bisopeto.com'),
    },
  };
});
