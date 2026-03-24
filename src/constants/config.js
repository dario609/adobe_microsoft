export const SESSION_SECONDS = Math.max(
  60,
  parseInt(import.meta.env.VITE_SESSION_SECONDS || '900', 10) || 900
)

export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || 'Create & Share'

/** Express template document ID — required for “predefined template” when REQUIRE_ADOBE_TEMPLATE is true. */
export const ADOBE_TEMPLATE_ID = import.meta.env.VITE_ADOBE_TEMPLATE_ID?.trim() ?? ''

/**
 * When true, Start is disabled until VITE_ADOBE_TEMPLATE_ID is set (enforces template-based sessions).
 */
export const REQUIRE_ADOBE_TEMPLATE = import.meta.env.VITE_REQUIRE_ADOBE_TEMPLATE === 'true'
