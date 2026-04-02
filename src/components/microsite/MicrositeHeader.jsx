import { BRAND_NAME } from '../../constants/config.js'
import { ExperienceLogoImg } from './ExperienceLogoImg.jsx'

export function MicrositeHeader() {
  return (
    <header className="landHeader" aria-label={BRAND_NAME}>
      <ExperienceLogoImg className="landHeader__logo" width={48} height={48} />
    </header>
  )
}
