const NAV_ITEMS = [
  { key: 'home', label: 'Home' },
  { key: 'pne2014', label: 'PNE 2014-2024' },
  { key: 'pne2026', label: 'PNE 2026-2036' },
  { key: 'diagnostico', label: 'Diagnóstico' },
]

export function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <nav aria-label="Navegação principal">
        {NAV_ITEMS.map((item) => (
          <button
            className={item.key === activePage ? 'nav-item is-active' : 'nav-item'}
            key={item.key}
            type="button"
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
