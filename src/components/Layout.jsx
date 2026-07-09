import { useMunicipality } from '../context/MunicipalityContext'
import { ContextBar } from './ContextBar'
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
      <Header
        activePage={activePage}
        onNavigate={onNavigate}
      />

      <div className="dashboard-main">
        <ContextBar
          activePage={activePage}
          municipios={municipios}
          selectedMunicipio={selectedMunicipio}
          onMunicipioChange={setSelectedMunicipio}
        />
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
