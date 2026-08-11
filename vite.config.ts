import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Electron nạp file qua giao thức file:// nên đường dẫn phải là tương đối.
  base: "./",
  build: {
    outDir: "dist/renderer",
    emptyOutDir: true,
    chunkSizeWarningLimit: 2500,
  },
  server: { port: 5173, strictPort: true },
});
