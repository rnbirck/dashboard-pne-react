import { MetricCard } from './MetricCard'

export function DiagnosticPanel({ data, municipio }) {
  if (!data) {
    return (
      <section className="detail-panel empty-panel">
        <p>Não há diagnóstico para {municipio}.</p>
      </section>
    )
  }

  const summary = data.summary ?? {}
  const categorias = data.categories ?? []

  return (
    <div className="diagnostic-panel">
      <section className="page-card diagnostic-hero">
        <div>
          <span className="eyebrow">Diagnóstico municipal</span>
          <h2>Diagnóstico de {municipio}</h2>
          <p>
            Categoria ativa:{' '}
            <strong style={{ color: 'var(--text-strong)' }}>{data.active_category ?? '-'}</strong>
            {' · '}
            leitura territorial orientada por evidências do ciclo vigente.
          </p>
        </div>
        <div className="diagnostic-summary">
          <MetricCard label="Indicadores analisados" value={summary.indicadores_analisados} />
          <MetricCard label="Metas atingidas" value={summary.metas_atingidas} tone="success" />
          <MetricCard label="Pontos de atenção" value={summary.pontos_de_atencao} tone="warning" />
        </div>
      </section>

      <section className="two-column">
        <ListCard title="Principais desafios" items={data.principais_desafios} tone="danger" />
        <ListCard title="Pontos positivos" items={data.pontos_positivos} tone="success" />
      </section>

      <section className="page-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Áreas diagnósticas</span>
            <h2>Leitura por área</h2>
            <p>Resumo por frente de análise para apoiar priorização municipal.</p>
          </div>
        </div>
        <div className="diagnostic-grid">
          {categorias.map((category) => (
            <article className="diagnostic-area" key={category.key}>
              <h4>{category.label}</h4>
              {category.subtitle && <p>{category.subtitle}</p>}
              <dl>
                <div>
                  <dt>Total</dt>
                  <dd>{category.total}</dd>
                </div>
                <div>
                  <dt>Atingidas</dt>
                  <dd>{category.achieved}</dd>
                </div>
                <div>
                  <dt>Atenção</dt>
                  <dd>{category.attention_count}</dd>
                </div>
              </dl>
              {category.reading && <p>{category.reading}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function ListCard({ items = [], title, tone = 'default' }) {
  return (
    <section className={`page-card list-card list-card--${tone}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">Leitura</span>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="list-card-body">
        {items.length ? (
          <ul className="simple-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>Nenhum item disponível.</p>
        )}
      </div>
    </section>
  )
}
