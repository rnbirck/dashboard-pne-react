import { formatRankingValue } from '../utils/format'

export function RankingBlock({
  title,
  items,
  emptyMessage = 'Nenhum item disponível.',
  valueMode = 'variation',
  unit = 'count',
}) {
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
              <div className="ranking-item__text">
                <strong>{item.label}</strong>
                {item.sub && <span>{item.sub}</span>}
              </div>
              <small>{pickRankingValue(item.display, valueMode, unit)}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </section>
  )
}

function pickRankingValue(display, mode, unit) {
  const raw =
    mode === 'distance'
      ? (display?.distance ?? display?.variation ?? '-')
      : (display?.variation ?? display?.distance ?? '-')
  if (typeof raw !== 'string') return String(raw)
  return formatRankingValue(display, unit, mode)
}
