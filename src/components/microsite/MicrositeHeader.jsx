import { BRAND_LOGO_URL } from '../../constants/config.js'

export function MicrositeHeader() {
  return (
    <header className="landHeader">
      <img className="landHeader__logo" src={BRAND_LOGO_URL} alt="" width={48} height={48} decoding="async" />
      <div className="landHeader__text">
        <h1 className="landHeader__title">Express-Kiosk</h1>
      </div>
    </header>
  )
}
