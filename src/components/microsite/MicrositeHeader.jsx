import { BRAND_LOGO_URL } from '../../constants/config.js'

export function MicrositeHeader({ brandName }) {
  return (
    <header className="landHeader">
      <img className="landHeader__logo" src={BRAND_LOGO_URL} alt="" width={48} height={48} decoding="async" />
      <div className="landHeader__text">
        <h1 className="landHeader__title">{brandName}</h1>
        <p className="landHeader__sub">Create your design, then save it in one flow.</p>
      </div>
    </header>
  )
}
