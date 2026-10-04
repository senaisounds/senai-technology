import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'three-vendor';
          }
          if (id.includes('@react-three/postprocessing') || id.includes('postprocessing')) {
            return 'three-post';
          }
          if (id.includes('@react-three/rapier')) {
            return 'three-physics';
          }
          if (id.includes('motion') || id.includes('lenis') || id.includes('maath')) {
            return 'motion';
          }
        },
      },
    },
  },
});
