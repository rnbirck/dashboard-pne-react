import { RioGrandeDoSulMap } from '../components/RioGrandeDoSulMap'

const DIRETRIZES = [
  { num: 'I', title: 'Planejamento estratégico', desc: 'Integra educação ao desenvolvimento local e regional.' },
  { num: 'II', title: 'Intersetorialidade', desc: 'Articula educação com outras políticas públicas.' },
  { num: 'III', title: 'Desenvolvimento integral', desc: 'Promove formação social, cultural e econômica.' },
  { num: 'IV', title: 'Pactuação federativa', desc: 'Fortalece cooperação entre União, Estado e municípios.' },
  { num: 'V', title: 'Equilíbrio dos recursos', desc: 'Busca financiamento adequado, equitativo e sustentável.' },
  { num: 'VI', title: 'Liberdade', desc: 'Valoriza aprender, ensinar, pesquisar e divulgar saberes.' },
  { num: 'VII', title: 'Qualidade e equidade', desc: 'Orienta a formulação das políticas educacionais.' },
  { num: 'VIII', title: 'Uso de evidências', desc: 'Apoia decisões com dados e resultados educacionais.' },
  { num: 'IX', title: 'Monitoramento e avaliação', desc: 'Acompanha metas, estratégias e implementação.' },
  { num: 'X', title: 'Promoção de direitos', desc: 'Valoriza diversidade, direitos humanos e sustentabilidade.' },
]

export function Home({
  selectedMunicipio,
  onNavigate,
}) {
  const hasMunicipio = Boolean(selectedMunicipio)

  return (
    <div className="page-stack home-page">
      <section className="home-hero">
        <article className="hero-intro">
          <div className="rs-illustration" aria-hidden="true">
            <RioGrandeDoSulMap />
          </div>

          <div className="hero-copy">
            <h1>Indicadores municipais de educação</h1>
            <p>
              Acompanhe indicadores, metas e diagnóstico territorial para apoiar o
              planejamento educacional do município.
            </p>
          </div>
        </article>

        <aside className={`required-card context-panel${hasMunicipio ? ' context-panel--selected' : ' context-panel--empty'}`}>
          <div className="context-panel__top">
            <div className="required-card__icon" aria-hidden="true">
              <PinIcon />
            </div>
            <span className={hasMunicipio ? 'context-status context-status--ready' : 'context-status context-status--empty'}>
              {hasMunicipio ? 'Dados prontos para navegação' : 'Nenhum município selecionado'}
            </span>
          </div>

          <div className="context-panel__copy">
            <span className="context-panel__eyebrow">
              {hasMunicipio ? 'Município selecionado para análise' : 'Seleção territorial'}
            </span>
            <h2>{hasMunicipio ? selectedMunicipio : 'Selecione um município'}</h2>
            <p>
              {hasMunicipio
                ? 'Acesse os ciclos do PNE e o diagnóstico territorial para este município.'
                : 'Escolha um município no topo da página para visualizar indicadores, metas e diagnóstico territorial.'}
            </p>
          </div>

          {hasMunicipio && (
            <div className="context-actions" aria-label="Atalhos do painel">
              <button type="button" className="context-action" onClick={() => onNavigate?.('pne2014')}>
                <CalendarIcon />
                <span>PNE 2014-2024</span>
              </button>
              <button type="button" className="context-action" onClick={() => onNavigate?.('pne2026')}>
                <CalendarIcon />
                <span>PNE 2026-2036</span>
              </button>
              <button type="button" className="context-action" onClick={() => onNavigate?.('diagnostico')}>
                <DocumentIcon />
                <span>Diagnóstico</span>
              </button>
            </div>
          )}
        </aside>
      </section>

      <section className="home-section home-section--compact home-section--diretrizes">
        <h2>10 diretrizes do novo PNE</h2>
        <p className="section-subtitle">
          O novo Plano Nacional de Educação organiza as prioridades da política educacional
          brasileira para o ciclo 2026-2036 e orienta o planejamento local.
        </p>
        <p className="section-subtitle section-subtitle--accent">
          Referências para monitoramento, cooperação e melhoria da educação nos municípios.
        </p>
        <div className="diretrizes-grid">
          {DIRETRIZES.map((d) => (
            <DiretrizCard key={d.num} num={d.num} title={d.title} desc={d.desc} />
          ))}
        </div>
      </section>

      <section className="home-section home-section--compact">
        <h2>O que você encontra aqui</h2>
        <div className="feature-grid">
          <FeatureCard
            icon={<BarsIcon />}
            title="Indicadores por ciclo"
            text="Indicadores organizados por ciclos do PNE, com evolução dos resultados do município."
          />
          <FeatureCard
            icon={<AwardIcon />}
            title="Metas e situação"
            text="Acompanhe o avanço do município em relação às metas do Plano Nacional de Educação."
          />
          <FeatureCard
            icon={<InstitutionIcon />}
            title="Diagnóstico municipal"
            text="Visão integrada dos principais desafios e avanços do território para apoiar decisões."
          />
        </div>
      </section>

      <section className="home-section home-section--compact">
        <h2>Módulos do painel</h2>
        <div className="module-grid">
          <ModuleCard
            icon={<CalendarIcon />}
            title="PNE 2014-2024"
            text="Veja os indicadores e metas do ciclo anterior, com evolução dos resultados do município."
            onClick={() => onNavigate?.('pne2014')}
          />
          <ModuleCard
            icon={<CalendarIcon />}
            title="PNE 2026-2036"
            text="Acompanhe os indicadores do novo ciclo e identifique prioridades para os próximos anos."
            onClick={() => onNavigate?.('pne2026')}
          />
          <ModuleCard
            icon={<DocumentIcon />}
            title="Diagnóstico"
            text="Diagnóstico territorial com análises e destaques da realidade do município."
            onClick={() => onNavigate?.('diagnostico')}
          />
        </div>
      </section>
    </div>
  )
}

function DiretrizCard({ num, title, desc }) {
  return (
    <article className="diretriz-card">
      <div className="diretriz-card__header">
        <span className="diretriz-num">{num}</span>
        <h3>{title}</h3>
      </div>
      <p>{desc}</p>
    </article>
  )
}

function FeatureCard({ icon, title, text }) {
  return (
    <article className="info-card">
      <div className="icon-bubble">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  )
}

function ModuleCard({ icon, title, text, onClick }) {
  return (
    <button type="button" className="module-card" onClick={onClick}>
      <div className="icon-bubble">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <ChevronIcon />
    </button>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  )
}

function BarsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h16" />
      <path d="M6 20V9h4v11M12 20V5h4v15M18 20v-8h2v8" />
    </svg>
  )
}

function AwardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="5" />
      <path d="m8.5 12-2 8 5.5-3 5.5 3-2-8" />
      <path d="m10 8 1.3 1.3L14.5 6" />
    </svg>
  )
}

function InstitutionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10h16L12 5zM6 10v8M10 10v8M14 10v8M18 10v8M4 19h16" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16M9 14h2M13 14h2" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5M9.5 13h5M9.5 17h5" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 5 7 7-7 7" />
    </svg>
  )
}
