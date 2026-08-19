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
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || 'https://xjllcclxkffrpdnbttmj.supabase.co'),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGxjY2x4a2ZmcnBkbmJ0dG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTgwMzYsImV4cCI6MjA4MTQ5NDAzNn0.GAIV28c8ZL-AOFHAiMr6nho-LmRvn6xXc0-2Oogel4E'),
      'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || env.VITE_RESEND_API_KEY || ''),
      'process.env.CONTACT_EMAIL': JSON.stringify(env.CONTACT_EMAIL || 'contact@bisopeto.com'),
    },
  };
});
