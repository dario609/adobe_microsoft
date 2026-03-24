export function UploadOverlay() {
  return (
    <div className="busyOverlay" role="alert" aria-busy="true">
      <div className="busyOverlay__card">
        <div className="busyOverlay__spinner" aria-hidden />
        <p className="busyOverlay__text">Uploading…</p>
      </div>
    </div>
  )
}
