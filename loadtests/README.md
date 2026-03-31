# Load tests (k6)

[k6](https://k6.io/) drives HTTP scenarios against the upload API. Install k6 on the runner (package managers: see k6 docs).

## Safety

- Prefer a **staging** server, not production Dropbox, unless you intend to write real files.
- For local/CI runs without Dropbox, start the API with **`LOAD_TEST_UPLOAD_NOOP=true`** so uploads validate and log history only (no Dropbox). Rate limiting is skipped in noop mode.
- Long scenarios (`baseline`, `event-traffic`, `spike`) generate many writes if Dropbox is enabled.

## Environment

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | API origin (default `http://127.0.0.1:3001`) |
| `SITE_TOKEN` or `K6_SITE_TOKEN` | `X-Site-Token` when site password is enabled |
| `SITE_PASSWORD` | k6 logs in via `POST /api/auth/site/login` if no token |
| `DURATION` | Override duration for `baseline` / `event-traffic` |
| `EVENT_VUS` | Concurrent VUs for event traffic (default `5`) |
| `SPIKE_VUS` / `SPIKE_CYCLES` | Spike size and repeat count (defaults `20` / `10`) |

## API reliability knobs (server)

| Variable | Purpose |
|----------|---------|
| `LOAD_TEST_UPLOAD_NOOP` | `true` — skip Dropbox; optional `LOAD_TEST_UPLOAD_DELAY_MS` simulates slow upstream |
| `DROPBOX_UPLOAD_TIMEOUT_MS` | Abort waiting for Dropbox after N ms → `504` + `DROPBOX_UPLOAD_TIMEOUT` (Dropbox may still complete) |
| `UPLOAD_RATE_LIMIT_PER_MINUTE` | Per-IP cap on `POST /api/upload` (default 120) |
| `IDEMPOTENCY_TTL_MS` / `IDEMPOTENCY_MAX_KEYS` | Idempotency cache for `Idempotency-Key` header |
| `TRUST_PROXY` | `1` / `true` — set `trust proxy` for correct client IPs behind a reverse proxy |

## npm scripts

```bash
npm run loadtest:k6:edge      # quick validation + abuse checks (~seconds)
npm run loadtest:k6:baseline  # ~1 req/s sustained
npm run loadtest:k6:event     # 5 VUs × 15m (override with DURATION)
npm run loadtest:k6:spike     # ramping bursts (10 cycles × ~1 min)
```

Requires `k6` on `PATH`.

## Simulating “slow Dropbox” / “Adobe delay”

- **Dropbox slow:** set `DROPBOX_UPLOAD_TIMEOUT_MS` and/or use noop + `LOAD_TEST_UPLOAD_DELAY_MS`.
- **Adobe export delay:** not an API concern; exercise in the browser or mock Adobe callbacks separately.

## Idempotency

Send header **`Idempotency-Key`** on retries after timeouts. Successful `200` responses are cached briefly so a retry does not create a second Dropbox file. The web client sends a key per upload attempt.
