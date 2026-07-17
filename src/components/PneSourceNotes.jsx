import { getDataSourceParts } from '../utils/dataSourceNotes'
import { DataSourceNote } from './DataSourceNote'
import { MethodNote } from './MethodNote'

export function PneSourceNotes({ compact = false, context, includeMethodology = true }) {
  const { methodology, source } = getDataSourceParts(context)

  return (
    <>
      {source ? <DataSourceNote source={source} /> : null}
      {includeMethodology && methodology && compact ? (
        <details className="platform-support-disclosure chart-methodology-disclosure">
          <summary className="platform-support-disclosure__summary">
            <span>Metodologia do indicador</span>
          </summary>
          <div className="platform-support-disclosure__body">
            <MethodNote className="data-source-note">Nota metodológica: {methodology}</MethodNote>
          </div>
        </details>
      ) : includeMethodology && methodology ? (
        <MethodNote className="data-source-note">Nota metodológica: {methodology}</MethodNote>
      ) : null}
    </>
  )
}
