export function QuickReadingHeading() {
  return (
    <span className="indicator-quick-reading__heading">
      <svg aria-hidden="true" className="indicator-quick-reading__heading-icon" fill="none" viewBox="0 0 24 24">
        <path d="M4 6h9M4 10h7M4 14h5" />
        <circle cx="15" cy="15" r="4" />
        <path d="m18 18 3 3" />
      </svg>
      <span>Leitura rápida</span>
    </span>
  )
}
