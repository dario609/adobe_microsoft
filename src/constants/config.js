/**
 * Session length and whether the countdown shows are controlled by the API (`GET /api/config`)
 * from server env: SESSION_SECONDS, SHOW_SESSION_TIMER. Optional Vite fallbacks if the API is down.
 */

export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Create & Share'

/** Public URL to logo image (place your file in /public, e.g. /brand-logo.svg). */
export const BRAND_LOGO_URL = import.meta.env.VITE_BRAND_LOGO_URL || '/brand-logo.svg'

/** Express template document ID — required for “predefined template” when REQUIRE_ADOBE_TEMPLATE is true. */
export const ADOBE_TEMPLATE_ID = import.meta.env.VITE_ADOBE_TEMPLATE_ID?.trim() ?? ''

/**
 * When true, Start is disabled until VITE_ADOBE_TEMPLATE_ID is set (enforces template-based sessions).
 */
export const REQUIRE_ADOBE_TEMPLATE = import.meta.env.VITE_REQUIRE_ADOBE_TEMPLATE === 'true'

/** Privacy / terms page (opens in a new tab). Override with `VITE_PRIVACY_TERMS_URL`. */
export const PRIVACY_TERMS_URL =
  import.meta.env.VITE_PRIVACY_TERMS_URL || 'http://wearethefittest.com/express/privacyandterms'

export const PRIVACY_TERMS_LABEL = 'Privacy and Terms of Use'
