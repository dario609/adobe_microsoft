import { AdminGalleryPanel } from './AdminGalleryPanel.jsx'
import { AdminSettingsPanel } from './AdminSettingsPanel.jsx'

export function AdminPanel() {
  return (
    <main className="adminRoot adminRoot--light">
      <section className="adminCard adminCard--light adminCard--hero">
        <div className="adminCard__head">
          <div>
            <h1 className="adminCard__title adminCard__title--dark">Admin Panel</h1>
            <p className="adminCard__eyebrow">Express-Kiosk · gallery & session</p>
          </div>
          <a className="btn btn--adminGradient" href="/" target="_blank" rel="noopener noreferrer">
            User Page
          </a>
        </div>
        <p className="adminCard__sub adminCard__sub--dark">
          Upload PNGs for the landing gallery. Optionally attach an Adobe Express template ID so guests open that
          design when they select the image and tap Start.
        </p>
        <AdminGalleryPanel />
      </section>
      <AdminSettingsPanel />
    </main>
  )
}
