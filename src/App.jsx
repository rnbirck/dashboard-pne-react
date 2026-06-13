import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { ErrorState } from './components/ErrorState'
import { Layout } from './components/Layout'
import { LoadingState } from './components/LoadingState'
import {
  loadIndicadores,
  loadMunicipioData,
  loadMunicipios,
  loadMunicipiosIndex,
  primeMunicipioCache,
} from './data/staticData'
import { CyclePage } from './pages/CyclePage'
import { Diagnostico } from './pages/Diagnostico'
import { Home } from './pages/Home'
import { useAsyncData } from './utils/useAsyncData'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [selectedMunicipio, setSelectedMunicipio] = useState(null)
  const [initialData, setInitialData] = useState({
    error: null,
    indicadores: null,
    loading: true,
    municipios: [],
    municipiosIndex: [],
  })

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      try {
        const [municipiosPayload, indicadoresPayload, municipiosIndexPayload] =
          await Promise.all([loadMunicipios(), loadIndicadores(), loadMunicipiosIndex()])
        const municipios = municipiosPayload.municipios ?? []
        const municipiosIndex = municipiosIndexPayload.municipios ?? []

        if (!cancelled) {
          setInitialData({
            error: null,
            indicadores: indicadoresPayload,
            loading: false,
            municipios,
            municipiosIndex,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setInitialData({
            error: error instanceof Error ? error.message : 'Erro inesperado.',
            indicadores: null,
            loading: false,
            municipios: [],
            municipiosIndex: [],
          })
        }
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedMunicipioEntry = useMemo(
    () => initialData.municipiosIndex.find((item) => item.nome === selectedMunicipio) ?? null,
    [initialData.municipiosIndex, selectedMunicipio],
  )

  const municipioState = useAsyncData(
    () => {
      if (!selectedMunicipioEntry?.slug) {
        return Promise.resolve(null)
      }
      return loadMunicipioData(selectedMunicipioEntry.slug).then((data) => {
        primeMunicipioCache(selectedMunicipioEntry.slug, data)
        return data
      })
    },
    [selectedMunicipioEntry?.slug],
  )

  const ready = Boolean(initialData.indicadores)

  return (
    <Layout
      activePage={activePage}
      indicadores={initialData.indicadores}
      municipioCount={initialData.municipios.length}
      municipios={initialData.municipios}
      selectedMunicipio={selectedMunicipio}
      onMunicipioChange={setSelectedMunicipio}
      onNavigate={setActivePage}
    >
      {initialData.loading ? (
        <LoadingState message="Carregando base do dashboard..." />
      ) : initialData.error ? (
        <ErrorState title="Erro ao carregar dados iniciais" message={initialData.error} />
      ) : !ready ? (
        <LoadingState message="Preparando município..." />
      ) : (
        <PageContent
          activePage={activePage}
          indicadores={initialData.indicadores}
          municipioCount={initialData.municipios.length}
          municipios={initialData.municipios}
          municipioState={municipioState}
          onMunicipioChange={setSelectedMunicipio}
          onNavigate={setActivePage}
          selectedMunicipio={selectedMunicipio}
        />
      )}
    </Layout>
  )
}

function PageContent({
  activePage,
  indicadores,
  municipioCount,
  municipios,
  municipioState,
  onMunicipioChange,
  onNavigate,
  selectedMunicipio,
}) {
  const { data: municipioData, error: municipioError, loading: municipioLoading } = municipioState

  if (activePage === 'home') {
    return (
      <Home
        indicadores={indicadores}
        municipioData={municipioData}
        municipioCount={municipioCount}
        municipios={municipios}
        onMunicipioChange={onMunicipioChange}
        onNavigate={onNavigate}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (!selectedMunicipio) {
    return <EmptyMunicipioState onNavigate={onNavigate} />
  }

  if (municipioLoading) {
    return <LoadingState message={`Carregando dados de ${selectedMunicipio}...`} />
  }

  if (municipioError) {
    return (
      <ErrorState
        title="Erro ao carregar dados do município"
        message={municipioError}
      />
    )
  }

  if (activePage === 'pne2014') {
    return (
      <CyclePage
        cycle="pne_2014_2024"
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
        title="PNE 2014-2024"
      />
    )
  }

  if (activePage === 'pne2026') {
    return (
      <CyclePage
        cycle="pne_2026_2036"
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
        title="PNE 2026-2036"
      />
    )
  }

  if (activePage === 'diagnostico') {
    return (
      <Diagnostico
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  return null
}

function EmptyMunicipioState({ onNavigate }) {
  return (
    <section className="empty-selection">
      <div className="empty-selection__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
      </div>
      <span className="eyebrow">Seleção obrigatória</span>
      <h1>Selecione um município para visualizar os indicadores deste ciclo.</h1>
      <p>
        Os indicadores, rankings e o diagnóstico municipal só são carregados depois da
        seleção. Volte ao início e escolha o município que deseja analisar.
      </p>
      <button type="button" className="primary-button" onClick={() => onNavigate?.('home')}>
        Selecionar município
      </button>
    </section>
  )
}

export default App
