/**
 * Resolve Dropbox-related env vars. Prefer server-style `DROPBOX_*`; also accept mistaken
 * `VITE_DROPBOX_*` (dotenv loads those literally; the Node server does not read `VITE_*` as `DROPBOX_*`).
 */
export function dropboxEnv(name) {
  const v = process.env[name]?.trim()
  if (v) return v
  const viteKey = `VITE_${name}`
  return process.env[viteKey]?.trim() ?? ''
}
