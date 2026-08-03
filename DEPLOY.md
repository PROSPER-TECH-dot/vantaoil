# Deploying Vanta Oil (Node.js / VPS)

The app is a TanStack Start SSR application built with Nitro using the
`node-server` preset. No `vite preview` is involved in production.

## Build

```bash
npm ci
npm run build
```

This produces:

```
.output/
  server/index.mjs   # HTTP server entry
  public/            # static client assets (served by the server)
```

## Run

```bash
npm start            # == node .output/server/index.mjs
```

Environment variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default `3000`) |
| `HOST` | Bind address (default all interfaces) |
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | backend access for server functions |
| `ZENGAPAY_API_KEY`, `ZENGAPAY_BASE_URL` | mobile-money payments |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | baked into the client bundle at **build** time |

`VITE_*` values must be present during `npm run build`; the unprefixed
secrets must be present at **runtime** on the server.

## systemd example

```ini
[Unit]
Description=Vanta Oil
After=network.target

[Service]
WorkingDirectory=/srv/vanta
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=/srv/vanta/.env.production
ExecStart=/usr/bin/node .output/server/index.mjs
Restart=always

[Install]
WantedBy=multi-user.target
```

Put nginx/Caddy in front for TLS and proxy to `127.0.0.1:3000`.

## Other targets

Override the Nitro preset without touching the config:

```bash
NITRO_PRESET=vercel npm run build
NITRO_PRESET=cloudflare-module npm run build
```

Lovable's own publish pipeline continues to build for Cloudflare
automatically — this configuration only affects self-hosted builds.
