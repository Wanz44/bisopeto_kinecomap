
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// Fix: Import specifically used methods to avoid type resolution issues with Node's process object
import { cwd } from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Use the imported cwd() instead of process.cwd() to resolve TS2339
  const env = loadEnv(mode, cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_GEMINI_API_KEY || ''),
      // Utilisation des identifiants fournis par l'utilisateur
      'process.env.SUPABASE_URL': JSON.stringify('https://xjllcclxkffrpdnbttmj.supabase.co'),
      'process.env.SUPABASE_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGxjY2x4a2ZmcnBkbmJ0dG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTgwMzYsImV4cCI6MjA4MTQ5NDAzNn0.GAIV28c8ZL-AOFHAiMr6nho-LmRvn6xXc0-2Oogel4E'),
    }
  };
});
