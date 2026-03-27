import { AdminGalleryPanel } from './AdminGalleryPanel.jsx'

export function AdminPanel() {
  return (
    <main className="adminRoot adminRoot--light">
      <section className="adminCard adminCard--light">
        <div className="adminCard__head">
          <h1 className="adminCard__title adminCard__title--dark">Admin Panel</h1>
          <a className="btn btn--outlineDark" href="/">
            User Page
          </a>
        </div>
        <p className="adminCard__sub adminCard__sub--dark">
          Upload PNG images for the landing page gallery. Guests pick one before starting; it appears above the editor.
        </p>
        <AdminGalleryPanel />
      </section>
    </main>
  )
}
