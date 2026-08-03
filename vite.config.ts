// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Production target for self-hosting (Node.js / VPS):
  //   npm run build  ->  .output/  (server + public assets)
  //   npm start      ->  node .output/server/index.mjs
  // Override with NITRO_PRESET (e.g. vercel, netlify, cloudflare-module).
  // Inside Lovable's own build pipeline the preset/output are forced to Cloudflare.
  nitro: {
    preset: process.env['NITRO_PRESET'] ?? "node-server",
    output: {
      dir: ".output",
      serverDir: ".output/server",
      publicDir: ".output/public",
    },
  },
});
