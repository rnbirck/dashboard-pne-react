import { InteractionChevron } from '../components/InteractionChevron'
import { SourceLine } from '../components/SourceLine'
import { StatCard } from '../components/StatCard'

const ENTRY_CARDS = [
  {
    detail: 'Acompanhe as metas legais, os resultados do ciclo 2014–2024 e o ciclo 2026–2036.',
    icon: TargetIcon,
    key: 'pne2026',
    title: 'Plano Nacional de Educação',
  },
  {
    detail: 'Explore atendimento, trajetória, aprendizagem, profissionais, infraestrutura, modalidades, territórios e projeções.',
    icon: EducationIcon,
    key: 'educacao',
    title: 'Indicadores educacionais',
  },
  {
    detail: 'Analise SIOPE, FUNDEB, VAAR, PNATE, execução e aplicação dos recursos.',
    icon: FinanceIcon,
    key: 'financeiros',
    title: 'Financiamento da educação',
  },
]

const NAVIGATION_STEPS = [
  {
    detail: 'Escolha o território na barra superior. A seleção será mantida durante a navegação.',
    number: '01',
    title: 'Selecione o município',
  },
  {
    detail: 'Acesse o PNE, os indicadores educacionais ou o financiamento da educação.',
    number: '02',
    title: 'Escolha uma frente de análise',
  },
  {
    detail: 'Use filtros, históricos, comparações e painéis de detalhamento para aprofundar a leitura.',
    number: '03',
    title: 'Explore os detalhes',
  },
  {
    detail: 'Verifique períodos, conceitos, fontes oficiais e cuidados de interpretação apresentados em cada módulo.',
    number: '04',
    title: 'Consulte fontes e metodologia',
  },
]

const ORIENTATION_CARDS = [
  {
    detail: 'Metas, indicadores e financiamento aparecem em uma leitura comum do território selecionado.',
    title: 'Visão municipal integrada',
  },
  {
    detail: 'Períodos, fontes oficiais e limites de interpretação acompanham os dados apresentados.',
    title: 'Evidências oficiais',
  },
  {
    detail: 'A organização por domínios ajuda a acompanhar prioridades e sustentar decisões da gestão.',
    title: 'Planejamento e decisão',
  },
]

export function Home({ onNavigate, selectedMunicipio }) {
  const municipioLabel = selectedMunicipio || 'Nenhum município selecionado'

  return (
    <div className="page-stack home-page home-page--foundation">
      <section className="home-hero home-hero--institutional">
        <div className="home-hero__content">
          <p className="home-hero__identity">Painel SESI-RS de Inteligência Analítica Municipal</p>
          <h1>Informação para compreender, acompanhar e planejar a educação municipal</h1>
          <p className="home-hero__description">
            Uma leitura municipal integrada de metas do PNE, indicadores educacionais, projeções,
            infraestrutura, profissionais e financiamento, organizada a partir de fontes oficiais.
          </p>
        </div>

        <aside className="home-context-card" aria-label="Contexto operacional do município">
          <span className="home-context-card__label">Contexto operacional</span>
          <strong>{municipioLabel}</strong>
          <p>
            {selectedMunicipio
              ? 'Use o seletor acima para trocar o território analisado em todas as páginas do painel.'
              : 'Selecione um município na barra de contexto para consultar os dados municipais.'}
          </p>
        </aside>
      </section>

      <section className="home-entry-section" aria-labelledby="home-entry-title">
        <div className="home-section__heading">
          <span className="home-section__label">Acessos principais</span>
          <h2 id="home-entry-title">Escolha uma frente de análise</h2>
        </div>

        <div className="home-entry-grid">
          {ENTRY_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <button
                aria-label={`Abrir ${card.title}`}
                className="home-entry-card interaction-card--navigation"
                key={card.key}
                type="button"
                onClick={() => onNavigate?.(card.key)}
              >
                <span className="home-entry-card__icon" aria-hidden="true">
                  <Icon />
                </span>
                <strong>{card.title}</strong>
                <span className="home-entry-card__footer">
                  <span>{card.detail}</span>
                  <InteractionChevron className="interaction-chevron--navigation" />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="home-section home-navigation-section" aria-labelledby="home-navigation-title">
        <div className="home-section__heading">
          <span className="home-section__label">Como navegar</span>
          <h2 id="home-navigation-title">Encontre a informação em poucos passos</h2>
          <p className="home-section__intro">
            O painel organiza a leitura municipal por território, domínio temático e nível de detalhamento.
          </p>
        </div>

        <div className="home-navigation-grid">
          {NAVIGATION_STEPS.map((step) => (
            <article className="home-navigation-step" key={step.number}>
              <span className="home-navigation-step__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-section--foundation" aria-labelledby="home-reading-title">
        <div className="home-section__heading">
          <span className="home-section__label">Como usar o painel</span>
          <h2 id="home-reading-title">Uma base comum para leitura e planejamento</h2>
        </div>
        <div className="foundation-stat-grid">
          {ORIENTATION_CARDS.map((card) => (
            <StatCard detail={card.detail} key={card.title} title={card.title} />
          ))}
        </div>
      </section>

      <SourceLine>
        INEP, Censo Escolar, FNDE, SIOPE e IBGE. Indicadores organizados a partir
        das bases oficiais consolidadas no painel.
      </SourceLine>

      <section className="home-about-panel" aria-labelledby="home-about-title">
        <div className="home-about-panel__heading">
          <span className="home-section__label">Sobre o painel</span>
          <h2 id="home-about-title">Sobre o painel</h2>
        </div>
        <div className="home-about-panel__copy">
          <p>
            O Painel SESI-RS de Inteligência Analítica Municipal organiza dados públicos para apoiar gestores
            na leitura de metas, condições educacionais e financiamento.
          </p>
          <p>
            As informações são apresentadas conforme a disponibilidade e o período de atualização de cada fonte oficial.
          </p>
        </div>
      </section>
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
