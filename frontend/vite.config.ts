import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: __dirname,
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.error(
              "\n[vite-proxy] ❌ Cannot reach Express backend at http://localhost:3000\n" +
              "  → Make sure 'npm run dev:server' is running.\n" +
              "  → Error:", err.message
            );
          });
        },
      },
    },
  },
  build: {
    outDir: "../dist/spa",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./client/types"),
    },
  },
});
