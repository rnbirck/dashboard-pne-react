import { useEffect, useMemo, useState } from 'react'
import './App.css'
import './styles/chart-system.css'
import './styles/pne-cycle-experience.css'
import './styles/platform-ui.css'
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
import { MunicipalitySelector } from './components/MunicipalitySelector'
import { Home } from './pages/Home'
import { PneLegalGoalsPage } from './pages/PneLegalGoalsPage'
import { PneOverviewPage } from './pages/PneOverviewPage'
import { useAsyncData } from './utils/useAsyncData'

const HASH_PAGE_MAP = Object.freeze({
  home: 'home',
  pneoverview: 'pne-overview',
  pnelegalgoals: 'pne-legal-goals',
  metaslegais: 'pne-legal-goals',
  pne2014: 'pne2014',
  pne2024: 'pne2014',
  pne2026: 'pne2026',
  diagnostico: 'diagnostico',
  educacao: 'educacao',
  financeiros: 'financeiros',
  fundeb: 'financeiros',
  pnate: 'financeiros',
  siope: 'financeiros',
  vaar: 'financeiros',
  sistemas: 'educacao',
  escolassistemas: 'educacao',
})

function getInitialActivePage() {
  if (typeof window === 'undefined') return 'home'

  const route = window.location.hash
    .replace(/^#\/?/, '')
    .split('?')[0]
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')

  return HASH_PAGE_MAP[route] ?? 'home'
}

function App() {
  const [activePage, setActivePage] = useState(getInitialActivePage)
  const [initialData, setInitialData] = useState({
    error: null,
    indicadores: null,
    loading: true,
    municipios: [],
    municipiosIndex: [],
  })

  useEffect(() => {
    function handleHashChange() {
      setActivePage(getInitialActivePage())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleNavigate(page) {
    const nextHash = `#${page}`
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    } else {
      setActivePage(page)
    }
  }

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
        onNavigate={handleNavigate}
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
            onNavigate={handleNavigate}
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
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (activePage === 'pne-overview') {
    return <PneOverviewPage onNavigate={onNavigate} />
  }

  if (activePage === 'pne-legal-goals' && !selectedMunicipio) {
    return (
      <PneLegalGoalsPage
        indicadores={indicadores}
        municipios={municipios}
        onMunicipioChange={setSelectedMunicipio}
        onNavigate={onNavigate}
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
        title="PNE 2014–2024"
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
        title="PNE 2026–2036"
      />
    )
  }

  if (activePage === 'pne-legal-goals') {
    return (
      <PneLegalGoalsPage
        indicadores={indicadores}
        municipioData={municipioData}
        municipios={municipios}
        onMunicipioChange={setSelectedMunicipio}
        onNavigate={onNavigate}
        selectedMunicipio={selectedMunicipio}
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
        indicadores={indicadores}
        initialMainBlock="panoramaEducacional"
        municipioData={municipioData}
        selectedMunicipio={selectedMunicipio}
      />
    )
  }

  if (activePage === 'financeiros') {
    return (
      <EducacaoPage
        indicadores={indicadores}
        initialMainBlock="financiamentoEducacao"
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
