import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { MunicipalityProvider, useMunicipality } from './context/MunicipalityContext'
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
import { EducacaoPage } from './pages/EducacaoPage'
import { FundebPage } from './pages/FundebPage'
import { MunicipalitySelector } from './components/MunicipalitySelector'
import { Home } from './pages/Home'
import { useAsyncData } from './utils/useAsyncData'

function App() {
  const [activePage, setActivePage] = useState('home')
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

  const ready = Boolean(initialData.indicadores)

  return (
    <MunicipalityProvider municipios={initialData.municipios}>
      <Layout
        activePage={activePage}
        municipios={initialData.municipios}
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
            municipios={initialData.municipios}
            municipiosIndex={initialData.municipiosIndex}
            onNavigate={setActivePage}
          />
        )}
      </Layout>
    </MunicipalityProvider>
  )
}

function PageContent({
  activePage,
  indicadores,
  municipios,
  municipiosIndex,
  onNavigate,
}) {
  const { selectedMunicipio, setSelectedMunicipio } = useMunicipality()
  const [initialEducationTheme, setInitialEducationTheme] = useState()

  function handlePageNavigate(page, educationTheme) {
    if (educationTheme) {
      setInitialEducationTheme(educationTheme)
    }
    onNavigate(page)
  }

  const selectedMunicipioEntry = useMemo(
    () => municipiosIndex.find((item) => item.nome === selectedMunicipio) ?? null,
    [municipiosIndex, selectedMunicipio],
  )

  const municipioState = useAsyncData(
    async () => {
      if (!selectedMunicipioEntry?.slug) {
        return null
      }

      const data = await loadMunicipioData(selectedMunicipioEntry.slug)
      primeMunicipioCache(selectedMunicipioEntry.slug, data)
      return data
    },
    [selectedMunicipioEntry?.slug],
  )

  const { data: municipioData, error: municipioError, loading: municipioLoading } = municipioState

  if (activePage === 'home') {
    return (
      <Home
        onNavigate={onNavigate}
        onNavigateFundeb={() => handlePageNavigate('educacao', 'fundeb')}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (!selectedMunicipio) {
    return (
      <EmptyMunicipioState
        onNavigate={onNavigate}
        onMunicipioChange={setSelectedMunicipio}
        municipios={municipios}
      />
    )
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
        indicadores={indicadores}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (activePage === 'educacao') {
    return (
      <EducacaoPage
        initialTheme={initialEducationTheme}
        onConsumeInitialTheme={() => setInitialEducationTheme(null)}
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (activePage === 'fundeb') {
    return (
      <FundebPage
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  return null
}

function EmptyMunicipioState({ onNavigate, onMunicipioChange, municipios }) {
  return (
    <section className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
      </div>
      <h1>Selecione um município para continuar</h1>
      <p>
        Os indicadores, rankings e o diagnóstico municipal só são carregados depois da
        seleção. Escolha o município que deseja analisar.
      </p>
      <div style={{ minWidth: 'min(320px, 100%)', marginTop: '4px' }}>
        <MunicipalitySelector
          variant="hero"
          municipios={municipios}
          selectedMunicipio=""
          onChange={onMunicipioChange}
        />
      </div>
      <button type="button" className="primary-button" onClick={() => onNavigate?.('home')}>
        Voltar ao início
      </button>
    </section>
  )
}

export default App
