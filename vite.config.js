import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths — works at any URL including GH Pages subpath
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
