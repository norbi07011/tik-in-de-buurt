import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 5177,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    global: 'globalThis',
    // Define process object for frontend compatibility
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL),
      GOOGLE_MAPS_API_KEY: JSON.stringify(process.env.GOOGLE_MAPS_API_KEY),
      REACT_APP_STRIPE_PUBLIC_KEY: JSON.stringify(process.env.REACT_APP_STRIPE_PUBLIC_KEY),
      REACT_APP_PAYPAL_CLIENT_ID: JSON.stringify(process.env.REACT_APP_PAYPAL_CLIENT_ID),
      REACT_APP_P24_MERCHANT_ID: JSON.stringify(process.env.REACT_APP_P24_MERCHANT_ID),
      REACT_APP_P24_POS_ID: JSON.stringify(process.env.REACT_APP_P24_POS_ID),
      REACT_APP_P24_KEY: JSON.stringify(process.env.REACT_APP_P24_KEY),
      REACT_APP_PAYU_POS_ID: JSON.stringify(process.env.REACT_APP_PAYU_POS_ID),
      REACT_APP_PAYU_KEY: JSON.stringify(process.env.REACT_APP_PAYU_KEY),
      REACT_APP_PAYU_CLIENT_ID: JSON.stringify(process.env.REACT_APP_PAYU_CLIENT_ID),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
