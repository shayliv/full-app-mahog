import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const apiOrigin = process.env.VITE_API_URL ?? "http://localhost:8001";
const isNgrok = process.env.VITE_API_URL && /ngrok-free\.app|\.ngrok\.(io|dev)/.test(process.env.VITE_API_URL);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [".ngrok-free.app", ".ngrok.io", ".ngrok.dev"],
    port: 5175,
    proxy: {
      "/static": {
        target: apiOrigin,
        changeOrigin: true,
        ...(isNgrok && {
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("ngrok-skip-browser-warning", "true");
            });
          },
        }),
      },
    },
  },
});
