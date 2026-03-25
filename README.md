# Adobe Express Microsite (Frontend + Backend)

This repo contains:

- **Frontend**: Vite + React (everything in `src/` + `public/`)
- **Backend**: Node + Express API (everything in `server/`)

You can deploy them separately:

- **Backend** on Render (or Railway)
- **Frontend** on Vercel

---

## Local development

Install deps:

```bash
npm install
```

Run **both** web + API locally:

```bash
npm run dev
```

- Web: `https://localhost:5173`
- API: `http://127.0.0.1:3001`

---

## Deploy backend to Render

### Render settings

- **Build command**: `npm install`
- **Start command**: `node server/index.js`
- **Port**: Render sets `PORT` automatically (the server now binds to `0.0.0.0`).

### Backend environment variables (Render)

#### Dropbox (required for upload)

- **`DROPBOX_APP_KEY`**
- **`DROPBOX_APP_SECRET`**
- **`DROPBOX_REDIRECT_URI`**  
  Must match your deployed callback exactly, e.g.  
  `https://YOUR-RENDER-DOMAIN.onrender.com/api/oauth/dropbox/callback`

Preferred auth (auto-refresh):

- **`DROPBOX_REFRESH_TOKEN`**

Optional:

- **`DROPBOX_UPLOAD_FOLDER`** (e.g. `/EventUploads`)

#### Timer (backend-driven)

- **`SESSION_SECONDS`**: `0` / empty = timer hidden, no countdown  
- **`SHOW_SESSION_TIMER`**: set to `false` / `0` / `off` to force-hide timer

#### Optional site password gate

- **`SITE_PASSWORD_ENABLED`**: `true` or `false`
- **`SITE_ACCESS_PASSWORD`**: password string (required if enabled)
- **`SITE_AUTH_SECRET`**: long random secret (required in production)

**Important for “Vercel frontend → Render backend”** (cross-site cookies):

- **`SITE_CROSS_SITE_COOKIES=true`**

---

## Deploy frontend to Vercel

### Vercel settings

- **Build command**: `npm run build`
- **Output directory**: `dist`

### Frontend environment variables (Vercel)

#### Adobe Express embed (required)

- **`VITE_ADOBE_CLIENT_ID`**
- **`VITE_ADOBE_APP_NAME`** (must be non-empty; otherwise you’ll see: `HostInfo must have required property 'appName'`)

Optional:

- **`VITE_ADOBE_TEMPLATE_ID`**
- **`VITE_REQUIRE_ADOBE_TEMPLATE`**: `true` / `false`
- **`VITE_BRAND_NAME`**
- **`VITE_BRAND_LOGO_URL`** (e.g. `/brand-logo.svg`)

#### Point the frontend at the backend (required for separated deploys)

- **`VITE_API_BASE_URL`**: your Render API base, e.g.  
  `https://YOUR-RENDER-DOMAIN.onrender.com`

The frontend will call:

- `VITE_API_BASE_URL + /api/upload`
- `VITE_API_BASE_URL + /api/banner`
- `VITE_API_BASE_URL + /api/config`
- `VITE_API_BASE_URL + /api/auth/site`

---

## Dropbox OAuth (deployed)

Once your backend is deployed and `DROPBOX_REDIRECT_URI` matches:

1. Open `https://YOUR-RENDER-DOMAIN.onrender.com/api/oauth/dropbox/start`
2. Approve Dropbox
3. Copy the `DROPBOX_REFRESH_TOKEN=...` printed by the callback page into Render env
4. Restart the Render service
