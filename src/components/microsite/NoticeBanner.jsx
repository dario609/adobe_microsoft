export function NoticeBanner({ children }) {
  return (
    <div className="toast" role="status">
      {children}
    </div>
  )
}
