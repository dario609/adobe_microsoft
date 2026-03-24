export function ErrorBanner({ message }) {
  if (!message) return null
  return (
    <div className="appError" role="alert">
      {message}
    </div>
  )
}
