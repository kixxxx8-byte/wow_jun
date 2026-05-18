import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "app",
  base: "/v8/",
  plugins: [react()],
  build: {
    outDir: "../dist/v8",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001/hokkaido-trip-c1907/asia-northeast3",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://127.0.0.1:5001/hokkaido-trip-c1907/asia-northeast3",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5174,
    strictPort: false,
  },
});
