
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charge les variables d'environnement basées sur le mode (development, production)
  // Le troisième argument '' permet de charger toutes les variables, pas seulement celles préfixées par VITE_
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
    },
    define: {
      // Expose la clé API de manière sécurisée.
      // Si la variable n'existe pas (ex: lors du build sans env var), on met une chaine vide pour éviter le crash.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
    }
  };
});
