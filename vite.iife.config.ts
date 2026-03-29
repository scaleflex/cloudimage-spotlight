import { defineConfig } from 'vite';
import { resolve } from 'path';

// Separate IIFE build for CDN <script> tag usage.
// Run after the main build: vite build --config vite.iife.config.ts
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/define.ts'),
      formats: ['iife'],
      name: 'CloudimageSpotlight',
      fileName: () => 'spotlight.min.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    minify: 'esbuild',
  },
});
