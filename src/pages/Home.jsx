import { RioGrandeDoSulMap } from '../components/RioGrandeDoSulMap'

const DIRETRIZES = [
  { num: '1', title: 'Planejamento estratégico', description: 'Organização das metas e prioridades.' },
  { num: '2', title: 'Intersetorialidade', description: 'Articulação entre políticas públicas.' },
  { num: '3', title: 'Desenvolvimento integral', description: 'Aprendizagem, permanência e bem-estar.' },
  { num: '4', title: 'Pactuação federativa', description: 'Colaboração entre União, Estado e municípios.' },
  { num: '5', title: 'Equilíbrio dos recursos', description: 'Uso mais justo e eficiente do financiamento.' },
  { num: '6', title: 'Liberdade', description: 'Respeito à pluralidade e à autonomia.' },
  { num: '7', title: 'Qualidade e equidade', description: 'Acesso com aprendizagem para todos.' },
  { num: '8', title: 'Uso de evidências', description: 'Decisões orientadas por dados oficiais.' },
  { num: '9', title: 'Monitoramento e avaliação', description: 'Acompanhamento contínuo das metas.' },
  { num: '10', title: 'Promoção de direitos', description: 'Inclusão, cidadania e diversidade.' },
]

export function Home({ onNavigate, selectedMunicipio }) {
  const municipioLabel = selectedMunicipio || 'Selecione um município'

  return (
    <div className="page-stack home-page">
      <section className="home-hero">
        <article className="hero-intro">
          <div className="hero-copy">
            <h1>
              <span>Painel municipal</span>
              <span>de educação</span>
            </h1>
            <p>
              Acompanhe indicadores, metas e o diagnóstico territorial do município selecionado,
              organizados por ciclo do Plano Nacional de Educação.
            </p>
          </div>

          <div className="rs-illustration" aria-hidden="true">
            <RioGrandeDoSulMap />
          </div>
        </article>

        <aside className="required-card context-panel">
          <div className="context-panel__copy">
            <span className="context-panel__eyebrow">Município selecionado</span>
            <div className="context-panel__municipio">
              <PinIcon />
              <h2>{municipioLabel}</h2>
            </div>
            <p>Acesse os módulos disponíveis para este município.</p>
          </div>

          <div className="context-actions" aria-label="Atalhos do painel">
            <ModuleLink icon={<CalendarIcon />} label="PNE 2014–2024" onClick={() => onNavigate?.('pne2014')} />
            <ModuleLink icon={<CalendarIcon />} label="PNE 2026–2036" onClick={() => onNavigate?.('pne2026')} />
            <ModuleLink icon={<BarsIcon />} label="Indicadores da Educação" onClick={() => onNavigate?.('educacao')} />
            <ModuleLink icon={<DocumentIcon />} label="Diagnóstico" onClick={() => onNavigate?.('diagnostico')} />
          </div>
        </aside>
      </section>

      <section className="home-section home-section--compact">
        <h2>O que você encontra aqui</h2>
        <div className="feature-grid">
          <FeatureCard
            icon={<BarsIcon />}
            title="Indicadores"
            text="Explore matrículas, escolas, docentes, fluxo, aprendizagem, oferta técnica e indicadores financeiros do FUNDEB."
          />
          <FeatureCard
            icon={<TargetIcon />}
            title="Metas e estratégias"
            text="Consulte metas, estratégias e referências dos ciclos do Plano Nacional de Educação."
          />
          <FeatureCard
            icon={<InstitutionIcon />}
            title="Diagnóstico municipal"
            text="Acesse análises territoriais para compreender desafios e oportunidades do município."
          />
        </div>
      </section>

      <section className="home-section home-section--compact home-section--diretrizes">
        <h2>10 diretrizes do novo PNE</h2>
        <div className="diretrizes-grid">
          {DIRETRIZES.map((diretriz) => (
            <DiretrizCard
              key={diretriz.num}
              num={diretriz.num}
              title={diretriz.title}
              description={diretriz.description}
            />
          ))}
        </div>
      </section>

      <section className="home-section home-section--compact">
        <h2>Módulos do painel</h2>
        <div className="module-grid">
          <ModuleCard
            icon={<BarsIcon />}
            title="Indicadores da Educação"
            text="Explore dados educacionais do município por tema e série histórica, incluindo indicadores financeiros do FUNDEB."
            onClick={() => onNavigate?.('educacao')}
          />
          <ModuleCard
            icon={<CalendarIcon />}
            title="PNE 2014–2024"
            text="Consulte indicadores e metas do ciclo anterior do PNE."
            onClick={() => onNavigate?.('pne2014')}
          />
          <ModuleCard
            icon={<CalendarIcon />}
            title="PNE 2026–2036"
            text="Acompanhe indicadores e prioridades do novo ciclo."
            onClick={() => onNavigate?.('pne2026')}
          />
          <ModuleCard
            icon={<DocumentIcon />}
            title="Diagnóstico"
            text="Acesse o diagnóstico territorial com informações e análises do município."
            onClick={() => onNavigate?.('diagnostico')}
          />
        </div>
      </section>
    </div>
  )
}

function DiretrizCard({ num, title, description }) {
  return (
    <article className="diretriz-card">
      <span className="diretriz-num">{num}</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
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
      <ChevronIcon />
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

function ModuleLink({ icon, label, onClick }) {
  return (
    <button type="button" className="context-action" onClick={onClick}>
      {icon}
      <span>{label}</span>
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

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="m14.5 9.5 4-4M18.5 5.5h-4v4" />
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
