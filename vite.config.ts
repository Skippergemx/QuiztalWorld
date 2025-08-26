import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      process: 'process/browser',
      util: 'util',
      stream: 'stream-browserify',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow external access for mobile testing
  },
  build: {
    target: ['es2015', 'safari11'], // Better mobile browser support
    minify: 'terser',
    cssMinify: true,
    sourcemap: false, // Disable for production to reduce size
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          web3: ['ethers', 'web3modal'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        },
        // Optimize asset file names for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Mobile-specific optimizations
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline smaller assets
    chunkSizeWarningLimit: 1000 // Warn for large chunks
  },
  // PWA-ready configuration
  optimizeDeps: {
    include: [
      'phaser',
      'ethers',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ],
    // Pre-bundle these for faster mobile loading
    esbuildOptions: {
      target: 'es2015'
    }
  },
  envDir: '.',
  envPrefix: 'VITE_'
});
