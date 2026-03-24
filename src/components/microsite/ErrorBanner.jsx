export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="microsite__error" role="alert">
      {message}
    </div>
  )
}
