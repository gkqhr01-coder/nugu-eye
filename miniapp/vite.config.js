import { defineConfig } from 'vite';
import { vite as aitDevtools } from '@apps-in-toss/devtools/unplugin';

export default defineConfig({
  base: './',
  plugins: [aitDevtools()],
});
