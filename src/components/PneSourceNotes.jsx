import { getDataSourceParts } from '../utils/dataSourceNotes'
import { DataSourceNote } from './DataSourceNote'
import { MethodNote } from './MethodNote'

export function PneSourceNotes({ context }) {
  const { methodology, source } = getDataSourceParts(context)

  return (
    <>
      {source ? <DataSourceNote source={source} /> : null}
      {methodology ? (
        <MethodNote className="data-source-note">Nota metodológica: {methodology}</MethodNote>
      ) : null}
    </>
  )
}
