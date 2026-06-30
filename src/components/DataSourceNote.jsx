import { getDataSourceNote } from '../utils/dataSourceNotes'

export function DataSourceNote({ className = '', context, source }) {
  const text = source ?? getDataSourceNote(context)

  if (!text) return null

  return (
    <p className={`data-source-note${className ? ` ${className}` : ''}`}>
      <span className="data-source-note__label">Fonte:</span>{' '}
      <span className="data-source-note__text">{text}</span>
    </p>
  )
}
