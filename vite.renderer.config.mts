import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error 可以正常解析
// eslint-disable-next-line import/no-unresolved
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
