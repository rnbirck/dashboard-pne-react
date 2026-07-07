import { SourceLine } from '../components/SourceLine'
import { StatCard } from '../components/StatCard'

const ENTRY_CARDS = [
  {
    detail: 'Ciclo anterior, próximo ciclo e situação do município.',
    eyebrow: 'Metas do PNE',
    icon: TargetIcon,
    key: 'pne2026',
    title: 'Acompanhar metas e prioridades',
  },
  {
    detail: 'Matrículas, escolas, etapas, redes, território e aprendizagem.',
    eyebrow: 'Indicadores de Educação',
    icon: EducationIcon,
    key: 'educacao',
    title: 'Ler o panorama educacional',
  },
  {
    detail: 'SIOPE, FUNDEB, VAAR, PNATE, receitas e aplicação de recursos.',
    eyebrow: 'Financiamento',
    icon: FinanceIcon,
    key: 'financeiros',
    title: 'Analisar indicadores financeiros',
  },
]

const ORIENTATION_CARDS = [
  {
    detail: 'O município selecionado orienta a leitura de metas, indicadores e financiamento.',
    eyebrow: 'Diagnóstico territorial',
    title: 'Contexto antes da decisão',
  },
  {
    detail: 'As fontes oficiais permanecem visíveis para sustentar acompanhamento e prestação de contas.',
    eyebrow: 'Evidências oficiais',
    title: 'Bases reconhecidas no centro',
  },
  {
    detail: 'Os blocos separam compromissos do PNE, panorama educacional e recursos públicos.',
    eyebrow: 'Planejamento público',
    title: 'Blocos claros para agir',
  },
]

export function Home({ onNavigate, selectedMunicipio }) {
  const municipioLabel = selectedMunicipio || 'Selecione um município'
  const heroTitle = selectedMunicipio
    ? `Como está a educação em ${selectedMunicipio}`
    : 'Escolha um município para iniciar a leitura'

  return (
    <div className="page-stack home-page home-page--foundation">
      <section className="home-hero home-hero--institutional">
        <div className="home-hero__content">
          <span className="eyebrow">Panorama do município</span>
          <h1>{heroTitle}</h1>
          <p>
            Uma leitura única de metas do PNE, indicadores educacionais e financiamento
            para apoiar diagnóstico e decisão com dados oficiais.
          </p>
        </div>

        <aside className="home-context-card" aria-label="Município em foco">
          <span className="home-context-card__label">Município em foco</span>
          <strong>{municipioLabel}</strong>
          <p>
            {selectedMunicipio
              ? 'Use os blocos abaixo para aprofundar a leitura deste território.'
              : 'Escolha um município na barra de contexto para carregar as páginas de dados.'}
          </p>
        </aside>
      </section>

      <section className="home-entry-grid" aria-label="Portas de entrada do painel">
        {ENTRY_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <button
              className="home-entry-card"
              key={card.key}
              type="button"
              onClick={() => onNavigate?.(card.key)}
            >
              <span className="home-entry-card__icon" aria-hidden="true">
                <Icon />
              </span>
              <span className="home-entry-card__eyebrow">{card.eyebrow}</span>
              <strong>{card.title}</strong>
              <span>{card.detail}</span>
            </button>
          )
        })}
      </section>

      <section className="home-section home-section--foundation">
        <div className="home-section__heading">
          <span className="eyebrow">Leitura do painel</span>
          <h2>Uma visão organizada para o acompanhamento municipal</h2>
        </div>
        <div className="foundation-stat-grid">
          {ORIENTATION_CARDS.map((card) => (
            <StatCard
              detail={card.detail}
              eyebrow={card.eyebrow}
              key={card.title}
              title={card.title}
            />
          ))}
        </div>
      </section>

      <SourceLine>
        INEP, Censo Escolar, FNDE, SIOPE e IBGE. Indicadores organizados a partir
        das bases oficiais consolidadas no painel.
      </SourceLine>
    </div>
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
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
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
