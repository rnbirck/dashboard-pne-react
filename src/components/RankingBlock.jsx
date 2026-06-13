export function RankingBlock({ title, items }) {
  return (
    <section className="ranking-block">
      <div className="ranking-heading">
        <span>Ranking</span>
        <h3>{title}</h3>
      </div>
      {items?.length ? (
        <ol>
          {items.map((item, index) => (
            <li key={item.indicator_key}>
              <span className="ranking-index">{index + 1}</span>
              <div>
                <strong>{item.label}</strong>
                {item.sub && <span>{item.sub}</span>}
              </div>
              <small>{item.display?.variation ?? item.display?.distance ?? '-'}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>Nenhum item disponível.</p>
      )}
    </section>
  )
}
