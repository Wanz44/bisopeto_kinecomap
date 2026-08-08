import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bisopeto.app',
  appName: 'Biso Peto',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
