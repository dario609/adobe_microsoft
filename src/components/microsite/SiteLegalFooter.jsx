import { PRIVACY_TERMS_LABEL, PRIVACY_TERMS_URL } from '../../constants/config.js'

export function SiteLegalFooter() {
  return (
    <footer className="siteLegalFooter">
      <a href={PRIVACY_TERMS_URL} target="_blank" rel="noopener noreferrer">
        {PRIVACY_TERMS_LABEL}
      </a>
    </footer>
  )
}
