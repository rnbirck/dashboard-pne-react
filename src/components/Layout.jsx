import { useMunicipality } from '../context/MunicipalityContext'
import { Header } from './Header'

export function Layout({
  activePage,
  children,
  municipios,
  onNavigate,
}) {
  const { selectedMunicipio, setSelectedMunicipio } = useMunicipality()

  return (
    <div className="dashboard-shell">
      <div className="dashboard-frame">
        <Header
          activePage={activePage}
          municipios={municipios}
          selectedMunicipio={selectedMunicipio}
          onMunicipioChange={setSelectedMunicipio}
          onNavigate={onNavigate}
        />

        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
