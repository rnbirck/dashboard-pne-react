import { Header } from './Header'

export function Layout({
  activePage,
  children,
  municipios,
  onMunicipioChange,
  onNavigate,
  selectedMunicipio,
}) {
  return (
    <div className="dashboard-shell">
      <div className="dashboard-frame">
        <Header
          activePage={activePage}
          municipios={municipios}
          onMunicipioChange={onMunicipioChange}
          onNavigate={onNavigate}
          selectedMunicipio={selectedMunicipio}
        />

        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
