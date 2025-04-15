import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',  
  server: {
    port: 5173, 
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'] // ✅ Moves Phaser into a separate chunk
        }
      }
    }
  }
});
