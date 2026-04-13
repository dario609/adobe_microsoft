# Adobe Express Embed — Integration submission

**Document purpose:** Production URL, access model, and operator instructions for Adobe review.  
**Product:** Adobe Express microsite (Express-Kiosk) — React frontend + Node/Express backend.  
**Date:** April 3, 2026  
**Version:** As deployed from repository `adobe-microsite`

---

## 1. Production environment URLs

Fill in the table below for your deployment. If frontend and API share one origin, use the same base URL for both.

| Environment | URL (replace placeholders) |
|-------------|----------------------------|
| **End-user microsite** | `https://YOUR-PRODUCTION-FRONTEND-DOMAIN/` |
| **Backend API base** (if separate host, e.g. Render) | `https://YOUR-API-DOMAIN` |
| **Operator admin panel** | `https://YOUR-PRODUCTION-FRONTEND-DOMAIN/admin` |

**Adobe Developer Console — allowed domains**

- Add the **origin** where end users load the microsite (scheme + host + port if non-default), e.g. `https://kiosk.example.com`.
- If the SPA is on Vercel and the API on another domain, ensure Express embed and any auth flows are allowed for the **page origin** users actually open.
- Dropbox OAuth (if used): redirect URI must match the backend, e.g. `https://YOUR-API-DOMAIN/api/oauth/dropbox/callback`.

---

## 2. Access credentials (for Adobe reviewers)

Describe only what reviewers need. Rotate or revoke credentials after review.

### 2.1 End-user (site) access

| Setting | Your answer |
|---------|-------------|
| **Site password gate enabled?** | Yes / No |
| **If yes — test password** | `[REDACTED — provide to Adobe separately]` |
| **If no** | State: *“Microsite is reachable without a guest password.”* |

**Note:** With frontend and API on different domains, cross-site cookies may require `SITE_CROSS_SITE_COOKIES=true` on the backend (see README).

### 2.2 Admin / operator access

| Setting | Your answer |
|---------|-------------|
| **Admin panel protected?** | Yes / No (typically Yes when `ADMIN_ACCESS_PASSWORD` is set) |
| **If yes — reviewer admin password** | `[REDACTED — provide separately or use staging]` |

**Do not** share in this file: Dropbox refresh tokens, SMB passwords, `SITE_AUTH_SECRET`, or long-lived production secrets. Prefer a **staging** build for deep admin demos.

---

## 3. Technical overview (for Adobe)

### 3.1 Architecture

- **Frontend:** Vite + React (`src/`), static build to `dist/`.
- **Backend:** Express 5 (`server/`), JSON + multipart APIs under `/api`.
- **Adobe integration:** Adobe Express loaded via the **Adobe Embed SDK** in-page. Required client env: `VITE_ADOBE_CLIENT_ID`, `VITE_ADOBE_APP_NAME` (non-empty).
- **Templates:** Gallery items can reference Adobe template IDs; **blank canvas** mode creates a new design at configured pixel width/height with `selectedCategory: 'yourStuff'`.
- **Export path:** User completes work in Express, then uses Express **Export & upload** (or equivalent). The embed callback supplies the asset; the frontend uploads it to **`POST /api/upload`** on your backend.
- **Storage:** Operator-configurable **Dropbox** or **SMB/CIFS** (see README for SMB constraints).

### 3.2 Key public / authenticated API surface (indicative)

| Area | Examples |
|------|----------|
| Config / auth | `/api/config`, `/api/auth/site`, admin routes under `/api/admin/*` |
| Gallery | `/api/gallery`, `/api/gallery/image/:id` |
| Branding (public read) | `/api/branding/landing-background`, `/api/branding/experience-logo`, `/api/branding/session-header-background`, `/api/branding/editor-workspace-background` |
| Upload | `/api/upload` |
| Banner | `/api/banner` (session banner asset) |

Exact routes match your deployed server version.

### 3.3 Session timer (guest UX)

- When enabled (`SESSION_SECONDS` ≥ 2 and timer shown), countdown runs in the session header.
- When the countdown completes the last second, the timer **resets** to the full session length (soft nudge) and a short notice may appear; the session does **not** force-close for the next guest automatically at zero.

---

## 4. Step-by-step — end-user (guest) flow

1. Open the **production user URL** in a supported desktop or tablet browser (validate Chrome / Edge / Safari as required for your event).
2. If a **site password** is enabled, enter it when prompted.
3. On the **landing page**, review branding, background, and the **template gallery**.
4. **Select one gallery item** (template or blank canvas, per configuration).
5. Tap **Start** (button shows **Preparing…** while the Adobe SDK loads, or **Unavailable** on error).
6. If prompted, enter the **pickup / display name** and confirm (used for export filename and pickup workflow).
7. The **Adobe Express** editor appears embedded. Edit using standard Express tools.
8. In Express, use **Export & upload** (wording from Express UI) to send the design to your backend; wait for success feedback.
9. Read any **thank-you** or next-step message (configurable in admin).
10. Tap **Leave** to end the session and return to the landing experience for the next guest (when applicable).

---

## 5. Step-by-step — operator / admin

1. Navigate to **`/admin`** on the frontend origin.
2. If admin password protection is on, authenticate via the admin gate.
3. Use **Admin Panel** sections as deployed, typically including:
   - **Gallery:** CRUD / upload for landing templates and metadata (template IDs, blank canvas dimensions, etc.).
   - **Session settings:** Experience logo, landing background, session header strip background, editor workspace background, content (e.g. thank-you message), session timer, site/admin passwords, upload destination (Dropbox vs SMB) and related fields.
4. After changing branding images, **refresh the user page** so browsers pick up new assets (cache-busting as implemented).

---

## 6. Demonstrative video (recommended)

Provide an **unlisted** video link (YouTube, Vimeo, or enterprise file share).

**Suggested outline (5–10 minutes)**

1. **0:00–0:45** — Open user URL; site password if enabled; show landing and gallery.  
2. **0:45–2:00** — Select template, **Start**, name entry.  
3. **2:00–6:00** — Express embed: short edit, **Export & upload**, success state.  
4. **6:00–7:00** — **Leave** and return to landing.  
5. **Optional** — Staging **admin** walk-through with secrets blurred.

---

## 7. Support and repository

- **Repository documentation:** `README.md` (deploy to Render/Vercel, env vars, Dropbox OAuth, SMB notes).
- **Contact for this submission:** `[YOUR_NAME, EMAIL, OR TICKET_ID]`

---

## 8. Checklist before sending to Adobe

- [ ] Production user URL confirmed and reachable.  
- [ ] Allowed domains / CORS / cookies verified for that URL.  
- [ ] Test credentials shared through a secure channel (not only inside this PDF).  
- [ ] Video link works for external viewers (unlisted / shared link).  
- [ ] Staging used if production secrets must not be exposed.

---

*End of document — replace all `YOUR-…` and bracketed placeholders before distribution.*
