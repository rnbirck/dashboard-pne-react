import { isMissing } from '../utils/educationFormatters'

export function EducationTable({ columns, rows, emptyMessage = 'Sem dados disponíveis.', caption = 'Dados educacionais' }) {
  if (!rows || rows.length === 0) {
    return <p className="education-table-empty">{emptyMessage}</p>
  }

  return (
    <div className="education-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="education-table">
        <caption className="u-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={col.className || ''}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => {
                const raw = row[col.key]
                const display = isMissing(raw) ? '\u2014' : col.format ? col.format(raw) : String(raw)
                return <td key={col.key} className={col.className || ''}>{display}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
