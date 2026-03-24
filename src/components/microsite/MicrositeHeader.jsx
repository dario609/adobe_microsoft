export function MicrositeHeader({ brandName }) {
  return (
    <header className="microsite__header">
      <div className="microsite__brand">
        <span className="microsite__logo" aria-hidden />
        <div>
          <h1 className="microsite__title">{brandName}</h1>
          <p className="microsite__tagline">
            Start → edit with Express → session timer → Finish → name your file → upload to Dropbox →
            reset for the next guest.
          </p>
        </div>
      </div>
    </header>
  )
}
