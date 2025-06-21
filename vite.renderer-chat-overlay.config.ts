import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  root: 'chat-overlay',
  build: {
    rollupOptions: {
      output: {
        dir: '.vite/renderer/chat_overlay_window',
      },
    },
  },
});
