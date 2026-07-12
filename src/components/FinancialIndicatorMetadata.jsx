const METADATA_FIELDS = [
  ['definition', 'O que é'],
  ['measures', 'O que mede'],
  ['calculation', 'Como é calculado'],
  ['financingSource', 'De onde vêm os recursos'],
  ['relevance', 'Por que é acompanhado'],
  ['referenceRule', 'Regra ou referência'],
  ['legalBasis', 'Base legal'],
  ['methodNote', 'Nota metodológica'],
]

export function FinancialIndicatorMetadata({ metadata }) {
  if (!metadata) return null

  return (
    <section className="financial-indicator-metadata" aria-labelledby="financial-indicator-metadata-title">
      <div className="financial-indicator-metadata__heading">
        <span className="eyebrow">Contexto do indicador</span>
        <h3 id="financial-indicator-metadata-title">Como ler este indicador</h3>
      </div>
      <dl>
        {METADATA_FIELDS.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{metadata[key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
