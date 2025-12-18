
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'node:process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      // Utilisation des noms de variables fournis par l'utilisateur
      'process.env.SUPABASE_URL': JSON.stringify(env.REACT_APP_SUPABASE_URL || ''),
      'process.env.SUPABASE_KEY': JSON.stringify(env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || ''),
    }
  };
});
