const NAV_ITEMS = [
  { key: 'home', label: 'Início', icon: HomeIcon },
  { key: 'pne2014', label: 'PNE 2014-2024', icon: CalendarIcon },
  { key: 'pne2026', label: 'PNE 2026-2036', icon: CalendarIcon },
  { key: 'diagnostico', label: 'Diagnóstico', icon: DocumentIcon },
]

export function Header({ activePage, onNavigate }) {
  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-mark" aria-hidden="true">PNE</div>
        <div className="brand-text">
          <span className="header-eyebrow">Plano Nacional de Educação</span>
          <div className="brand-line">Dashboard PNE</div>
          <p>Leitura territorial dos indicadores municipais de educação</p>
        </div>
      </div>

      <nav className="top-nav" aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              className={item.key === activePage ? 'nav-item is-active' : 'nav-item'}
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </header>
  )
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h5v-6h3v6h5V9.5" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16M9 14h2M13 14h2" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5M9.5 13h5M9.5 17h5" />
    </svg>
  )
}
