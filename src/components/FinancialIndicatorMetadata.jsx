const METADATA_FIELDS = [
  ['definition', 'O que é'],
  ['calculation', 'Como é calculado'],
  ['financingSource', 'De onde vêm os recursos'],
  ['referenceRule', 'Regra ou referência'],
  ['legalBasis', 'Base legal'],
  ['methodNote', 'Nota metodológica'],
]

export function FinancialIndicatorMetadata({ metadata }) {
  if (!metadata) return null

  return (
    <section className="financial-indicator-metadata" aria-labelledby="financial-indicator-metadata-title">
      <div className="financial-indicator-metadata__heading">
        <span className="eyebrow">Referência técnica</span>
        <h2 id="financial-indicator-metadata-title">Conceito, cálculo, fonte e base legal</h2>
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
