import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          jpgToPdf: path.resolve(__dirname, 'jpg-to-pdf.html'),
          pdfToJpg: path.resolve(__dirname, 'pdf-to-jpg.html'),
          mergePdf: path.resolve(__dirname, 'merge-pdf.html'),
          compressPdf: path.resolve(__dirname, 'compress-pdf.html'),
          wordToPdf: path.resolve(__dirname, 'word-to-pdf.html'),
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
