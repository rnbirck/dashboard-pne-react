import { useRef } from 'react'
import { MunicipalitySelector } from '../components/MunicipalitySelector'
import { RioGrandeDoSulMap } from '../components/RioGrandeDoSulMap'

export function Home({
  municipioData,
  municipios,
  selectedMunicipio,
  onMunicipioChange,
  onNavigate,
}) {
  const selectRef = useRef(null)
  const hasMunicipio = Boolean(selectedMunicipio)

  function focusMunicipioSelect() {
    selectRef.current?.focus()
    selectRef.current?.click()
  }

  return (
    <div className="page-stack home-page">
      <section className="home-hero">
        <article className="hero-intro">
          <div className="rs-illustration" aria-hidden="true">
            <RioGrandeDoSulMap />
          </div>

          <div className="hero-copy">
            <span className="hero-eyebrow">Dashboard PNE</span>
            <h1>Indicadores municipais de educação</h1>
            <p>
              Painel com dados oficiais do Plano Nacional de Educação para análise de metas,
              tendências e diagnóstico de cada município.
            </p>
          </div>
        </article>

        <aside className="required-card">
          <div className="required-card__top">
            <div className="required-card__icon" aria-hidden="true">
              <PinIcon />
            </div>
            <span className="required-badge">Obrigatório</span>
          </div>

          <h2>{hasMunicipio ? `${selectedMunicipio} selecionado` : 'Selecione um município para começar'}</h2>

          <MunicipalitySelector
            ref={selectRef}
            variant="hero"
            municipios={municipios}
            selectedMunicipio={selectedMunicipio}
            onChange={onMunicipioChange}
          />

          <p>
            A seleção do município é necessária para carregar os indicadores, rankings e o diagnóstico territorial.
          </p>

          <div className={hasMunicipio ? 'selection-alert is-selected' : 'selection-alert'}>
            <AlertIcon />
            <span>
              {hasMunicipio
                ? `Dados de ${municipioData?.nome ?? selectedMunicipio} prontos para navegação.`
                : 'Nenhum município selecionado. Escolha um município para visualizar o painel.'}
            </span>
          </div>
        </aside>
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

      <section className="home-cta home-cta--compact">
        <div>
          <h2>Selecione um município para acessar os indicadores, metas e diagnóstico.</h2>
        </div>
        <button type="button" className="primary-button" onClick={focusMunicipioSelect}>
          <PinIcon />
          <span>Selecionar município</span>
        </button>
      </section>
    </div>
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

function StepCard({ icon, number, title, text }) {
  return (
    <article className="step-card">
      <span className="step-number">{number}</span>
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

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6M12 17h.01" />
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

function PieIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v9h9A9 9 0 1 1 12 3Z" />
      <path d="M15 3.5A9 9 0 0 1 20.5 9H15Z" />
    </svg>
  )
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18h16M5 15l5-5 4 4 5-8" />
      <path d="M15 6h4v4" />
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

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.8" />
      <path d="M16 8 21 3M18 3h3v3" />
    </svg>
  )
}
