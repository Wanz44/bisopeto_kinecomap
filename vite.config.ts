
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement basées sur le mode (development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
    define: {
      // Expose la clé API si elle n'est pas préfixée par VITE_
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  };
});
