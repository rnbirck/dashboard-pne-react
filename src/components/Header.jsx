const NAV_BLOCKS = [
  {
    icon: HomeIcon,
    key: 'home',
    label: 'Home',
    target: 'home',
  },
  {
    icon: TargetIcon,
    key: 'pne',
    label: 'Plano Nacional de Educação',
    subitems: [
      { key: 'pne-overview', label: 'O que é o PNE', target: 'pne-overview' },
      { key: 'pne2014', label: 'PNE 2014-2024', target: 'pne2014' },
      { key: 'pne2026', label: 'PNE 2026-2036', target: 'pne2026' },
      { key: 'pne-legal-goals', label: 'Metas da Lei', target: 'pne-legal-goals' },
      { key: 'diagnostico', label: 'Diagnóstico municipal', target: 'diagnostico' },
    ],
    target: 'pne-overview',
  },
  {
    icon: EducationIcon,
    key: 'educacao',
    label: 'Indicadores de Educação',
    target: 'educacao',
  },
  {
    icon: FinanceIcon,
    key: 'financeiros',
    label: 'Indicadores Financeiros da Educação',
    target: 'financeiros',
  },
]

const PNE_PAGES = new Set(['pne-overview', 'pne2014', 'pne2026', 'pne-legal-goals', 'diagnostico'])

export function Header({ activePage, onNavigate }) {
  return (
    <header className="app-header" aria-label="Navegação do Dashboard PNE">
      <div className="brand-lockup">
        <div className="brand-name" aria-label="Dashboard PNE">
          <span>E</span>
        </div>
        <div className="brand-copy">
          <span className="brand-eyebrow">Dashboard PNE</span>
          <h1>Acompanhamento municipal</h1>
          <p>Indicadores e financiamento</p>
        </div>
      </div>

      <nav className="top-nav" aria-label="Navegação principal">
        {NAV_BLOCKS.map((item) => {
          const Icon = item.icon
          const isActive = item.key === 'pne'
            ? PNE_PAGES.has(activePage)
            : item.key === activePage

          return (
            <div className="nav-group" key={item.key}>
              <button
                className={isActive ? 'nav-item is-active' : 'nav-item'}
                type="button"
                onClick={() => onNavigate(item.target)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-item__dot" aria-hidden="true" />
                <Icon />
                <span>{item.label}</span>
              </button>

              {item.subitems ? (
                <div className="nav-subitems" aria-label="Subitens do Plano Nacional de Educação">
                  {item.subitems.map((subitem) => (
                    <button
                      className={
                        subitem.key === activePage
                          ? 'nav-subitem is-active'
                          : 'nav-subitem'
                      }
                      key={subitem.key}
                      type="button"
                      onClick={() => onNavigate(subitem.target)}
                    >
                      {subitem.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
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

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="m14.5 9.5 4-4M18.5 5.5h-4v4" />
    </svg>
  )
}

function EducationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 10L12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 3 2.5 6 2.5s6-1.5 6-2.5v-5" />
    </svg>
  )
}

function FinanceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18h16" />
      <path d="M7 18V9h3v9M12 18V5h3v13M17 18v-6h3v6" />
      <path d="M4 6h3" />
    </svg>
  )
}
