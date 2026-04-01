import { ExperienceLogoImg } from './ExperienceLogoImg.jsx'

export function MicrositeHeader() {
  return (
    <header className="landHeader">
      <ExperienceLogoImg className="landHeader__logo" width={48} height={48} />
      <div className="landHeader__text">
        <h1 className="landHeader__title">Express-Kiosk</h1>
      </div>
    </header>
  )
}
