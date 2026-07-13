import { useEffect, useMemo, useState } from 'react'
import './App.css'
import './styles/chart-system.css'
import './styles/pne-cycle-experience.css'
import './styles/platform-ui.css'
import './styles/financial-pages.css'
import './styles/navigation-shell.css'
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
import { FinancialPage } from './pages/FinancialPage'
import { MunicipalitySelector } from './components/MunicipalitySelector'
import { Home } from './pages/Home'
import { PneLegalGoalsPage } from './pages/PneLegalGoalsPage'
import { PneOverviewPage } from './pages/PneOverviewPage'
import { FINANCIAL_PAGE_KEYS } from './data/financialModules'
import { getEducationSectionFromLocation } from './data/educationIndicatorCatalog'
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
  financeirosaplicacaorecursos: FINANCIAL_PAGE_KEYS.application,
  financeirosfundeb: FINANCIAL_PAGE_KEYS.fundeb,
  financeirospnate: FINANCIAL_PAGE_KEYS.pnate,
  financeirosvaar: FINANCIAL_PAGE_KEYS.vaar,
  fundeb: FINANCIAL_PAGE_KEYS.fundeb,
  pnate: FINANCIAL_PAGE_KEYS.pnate,
  siope: FINANCIAL_PAGE_KEYS.application,
  vaar: FINANCIAL_PAGE_KEYS.vaar,
  sistemas: 'educacao',
  escolassistemas: 'educacao',
})

const FINANCIAL_PAGES = new Set(Object.values(FINANCIAL_PAGE_KEYS))

function getInitialActivePage() {
  if (typeof window === 'undefined') return 'home'

  const rawHash = window.location.hash
    .replace(/^#\/?/, '')
  const [rawRoute, rawQuery = ''] = rawHash.split('?')
  const route = rawRoute
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
  const params = new URLSearchParams(rawQuery)

  if (route === 'financeiros') {
    const requestedModule = params.get('modulo') ?? params.get('module')
    const normalizedModule = String(requestedModule ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .replace(/[^a-z0-9]/g, '')

    if (normalizedModule === 'fundeb') return FINANCIAL_PAGE_KEYS.fundeb
    if (normalizedModule === 'pnate') return FINANCIAL_PAGE_KEYS.pnate
    if (normalizedModule === 'vaar' || normalizedModule === 'complementacaovaar') return FINANCIAL_PAGE_KEYS.vaar
    if (normalizedModule === 'siope' || normalizedModule === 'aplicacaorecursos') return FINANCIAL_PAGE_KEYS.application
  }

  return HASH_PAGE_MAP[route] ?? 'home'
}

function App() {
  const [activePage, setActivePage] = useState(getInitialActivePage)
  const [activeEducationSection, setActiveEducationSection] = useState(() => getEducationSectionFromLocation())
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
      setActiveEducationSection(getEducationSectionFromLocation())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function handleNavigate(page) {
    const nextHash = `#${page}`
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    } else {
      setActivePage(getInitialActivePage())
      setActiveEducationSection(getEducationSectionFromLocation())
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
        activeEducationSection={activeEducationSection}
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

  if (FINANCIAL_PAGES.has(activePage)) {
    return (
      <FinancialPage
        municipioData={municipioData}
        municipioError={municipioError}
        municipioLoading={municipioLoading}
        pageKey={activePage}
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
      <div className="empty-municipality-selector">
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
