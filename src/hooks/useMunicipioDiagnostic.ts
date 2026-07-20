import { loadMunicipioDiagnostic } from '../data/staticData'
import type { MunicipalDiagnosticContractV2 } from '../features/diagnostic/diagnosticTypes'
import type { AsyncDataState } from '../types/async'
import { useAsyncData } from '../utils/useAsyncData'

export function useMunicipioDiagnostic(
  slug: string | null | undefined,
): AsyncDataState<MunicipalDiagnosticContractV2 | null> {
  return useAsyncData(
    async () => {
      if (!slug) return null
      return loadMunicipioDiagnostic(slug)
    },
    [slug],
  )
}
