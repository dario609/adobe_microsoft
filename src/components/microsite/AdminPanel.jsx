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
        <AdminGalleryPanel />
      </section>
      <AdminSettingsPanel />
    </main>
  )
}
