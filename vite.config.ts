import { defineConfig, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const KOKEB_PATHS = new Set(["/kokeb-3d", "/kokeb-3d.html", "/work/kokeb-3d", "/work/kokeb-3d.html"]);

function kokebStatic() {
  const file = path.resolve("public/kokeb-3d.html");
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req, res, next) => {
      const url = (req.url ?? "").split("?")[0] ?? "";
      if (!KOKEB_PATHS.has(url)) {
        next();
        return;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      fs.createReadStream(file).pipe(res);
    });
  };
  return {
    name: "kokeb-static",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

async function handleApi(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split("?")[0] ?? "";
  if (url !== "/api/chat" && url !== "/api/submit-lead") {
    next();
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    const raw = Buffer.concat(chunks);
    const request = new Request(new URL(url, "http://127.0.0.1"), {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : raw,
    });
    const mod = url === "/api/chat" ? await import("./api/chat.ts") : await import("./api/submit-lead.ts");
    const response: Response = await mod.default(request);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    if (!response.body) {
      res.end();
      return;
    }
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error("[local-api]", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ reply: "Senai Technology — hello@senaitechnology.com. Starter $2,500, Growth $4,800, Signature $8,500." }));
  }
}

function localApi() {
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req, res, next) => {
      void handleApi(req, res, next);
    });
  };
  return {
    name: "local-api",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig({
  plugins: [react(), kokebStatic(), localApi()],
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
