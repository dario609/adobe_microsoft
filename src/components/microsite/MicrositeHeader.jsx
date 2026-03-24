export function MicrositeHeader({ brandName }) {
  return (
    <header className="landHeader">
      <div className="landHeader__mark" aria-hidden />
      <div className="landHeader__text">
        <h1 className="landHeader__title">{brandName}</h1>
        <p className="landHeader__sub">Create your design, then save it in one flow.</p>
      </div>
    </header>
  )
}
