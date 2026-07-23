import { loadMunicipioDiagnostic } from '../data/staticData'
import type { MunicipalDiagnosticContractV2 } from '../features/diagnostic/diagnosticTypes'
import type { AsyncDataState } from '../types/async'
import { useAsyncData } from '../utils/useAsyncData'

export function useMunicipioDiagnostic(
  idMunicipio: string | null | undefined,
): AsyncDataState<MunicipalDiagnosticContractV2 | null> {
  return useAsyncData(
    async () => {
      if (!idMunicipio) return null
      return loadMunicipioDiagnostic(idMunicipio)
    },
    [idMunicipio],
  )
}
