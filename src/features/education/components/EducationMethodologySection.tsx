import type { ReactNode } from 'react'
import { EDUCATION_SOURCE_CATALOG } from '../../../data/educationIndicatorCatalog.js'
import {
  formatIndicatorCount,
  formatSourceYears,
  getIndicatorYears,
  normalizeEducationIndicatorLabel,
  normalizeMethodologyId,
} from '../educationFormatters'
import type { EducationIndicatorCatalogItem, EducationIndicatorResult } from '../educationTypes'

interface EducationMethodologyCatalogItem extends EducationIndicatorCatalogItem {
  label: string
  source: string
}

interface EducationMethodologySectionProps {
  catalog: ReadonlyArray<EducationMethodologyCatalogItem>
  items: ReadonlyArray<EducationIndicatorResult>
}

interface MethodologyTextSectionProps {
  children: ReactNode
  title: string
  variant?: string
}

export function EducationMethodologySection({ catalog, items }: EducationMethodologySectionProps) {
  const itemByKey = new Map(items.map((item) => [item.key, item]))
  const sourceGroups = EDUCATION_SOURCE_CATALOG
    .map((source) => {
      const indicators = catalog.filter((indicator) => indicator.source === source.key)
      const years: number[] = indicators.flatMap((indicator) => getIndicatorYears(itemByKey.get(indicator.key)))
      return {
        ...source,
        indicators,
        years: Array.from(new Set(years)).sort((a, b) => a - b),
      }
    })
    .filter((source) => source.indicators.length > 0)

  return (
    <div className="education-methodology-page">
      <MethodologyTextSection title="Escopo do diagnóstico" variant="scope">
        <p>O diagnóstico considera instituições de ensino localizadas no município. Quando disponíveis, os dados distinguem diferentes dependências administrativas e recortes da oferta educacional.</p>
        <p>Os indicadores apoiam a leitura do território, mas não substituem levantamentos complementares realizados pelo município.</p>
      </MethodologyTextSection>

      <section className="page-card education-methodology-sources" aria-labelledby="education-methodology-sources-title">
        <div className="education-methodology-section-heading">
          <div>
            <span className="eyebrow">Relação derivada do catálogo</span>
            <h3 id="education-methodology-sources-title">Fontes e periodicidade</h3>
          </div>
          <span>{formatIndicatorCount(catalog.length)} catalogados</span>
        </div>
        <p className="education-methodology-lead">A relação abaixo é montada a partir das fontes declaradas no catálogo central, com a cobertura observada para o município selecionado.</p>
        <div className="education-methodology-source-grid">
          {sourceGroups.map((source) => (
            <article className="education-methodology-source" key={source.key}>
              <div className="education-methodology-source__heading">
                <h4>{source.officialName}</h4>
                <span>{formatIndicatorCount(source.indicators.length)}</span>
              </div>
              <dl className="education-methodology-source__metadata">
                <div>
                  <dt>Periodicidade</dt>
                  <dd>{source.periodicity}</dd>
                </div>
                <div>
                  <dt>Último ano / intervalo</dt>
                  <dd>{formatSourceYears(source.years)}</dd>
                </div>
              </dl>
              <details className="education-methodology-source__indicators">
                <summary>Indicadores relacionados</summary>
                <p>{source.indicators.map((indicator) => normalizeEducationIndicatorLabel(indicator.label)).join('; ')}</p>
              </details>
            </article>
          ))}
        </div>
      </section>

      <MethodologyTextSection title="Como interpretar" variant="interpretation">
        <ul>
          <li>Cada card mantém seu próprio ano de referência; os anos podem variar entre indicadores.</li>
          <li>Zero é um valor válido quando informado pela fonte. Ausência de dado não deve ser interpretada como zero.</li>
          <li>Variações entre o primeiro e o último ponto válido consideram apenas os anos com dado disponível.</li>
          <li>Fontes distintas podem apresentar valores diferentes por adotarem recortes, definições e coberturas próprias.</li>
          <li>Alertas de cobertura parcial permanecem associados ao indicador e devem ser considerados na leitura.</li>
        </ul>
      </MethodologyTextSection>

      <MethodologyTextSection title="Limitações" variant="limitations">
        <ul>
          <li>Escolas localizadas no território não representam necessariamente a residência dos estudantes.</li>
          <li>Os dados atuais não identificam todas as pessoas que estão fora da escola.</li>
          <li>Os indicadores não calculam automaticamente déficit de vagas.</li>
          <li>As projeções são cenários estimados e não constituem previsão oficial.</li>
          <li>Periodicidade, cobertura e disponibilidade variam entre fontes e municípios.</li>
          <li>Um diagnóstico para o PME pode exigir dados complementares produzidos pelo município.</li>
        </ul>
      </MethodologyTextSection>

      <section className="page-card education-methodology-links" aria-labelledby="education-methodology-links-title">
        <span className="eyebrow">Leituras relacionadas</span>
        <h3 id="education-methodology-links-title">Consulte também</h3>
        <p>As páginas relacionadas preservam seus próprios indicadores e critérios.</p>
        <div className="education-methodology-links__list">
          <a href="#pne-overview">Metas e resultados do PNE</a>
          <a href="#financeiros">Indicadores Financeiros da Educação</a>
        </div>
      </section>
    </div>
  )
}

function MethodologyTextSection({ children, title, variant }: MethodologyTextSectionProps) {
  const variantClass = variant ? ` education-methodology-text--${variant}` : ''
  return (
    <section className={`page-card education-methodology-text${variantClass}`} aria-labelledby={`education-methodology-${normalizeMethodologyId(title)}`}>
      <span className="eyebrow">Metodologia</span>
      <h3 id={`education-methodology-${normalizeMethodologyId(title)}`}>{title}</h3>
      {children}
    </section>
  )
}
