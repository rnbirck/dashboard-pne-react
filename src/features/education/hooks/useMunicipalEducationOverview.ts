import { useEffect, useState } from 'react'
import {
  municipalEducationOverviewLoader,
  type MunicipalEducationOverviewLoadStatus,
} from '../../../data/municipalEducationOverview'
import type { MunicipalEducationOverviewV1 } from '../municipalEducationOverviewTypes'

export interface MunicipalEducationOverviewState {
  status: MunicipalEducationOverviewLoadStatus
  data: MunicipalEducationOverviewV1 | null
  idMunicipality: string | null
}

const INACTIVE_STATE: MunicipalEducationOverviewState = {
  status: 'idle',
  data: null,
  idMunicipality: null,
}

export function useMunicipalEducationOverview(
  idMunicipality: string | null | undefined,
  active: boolean,
): MunicipalEducationOverviewState {
  const [state, setState] = useState<MunicipalEducationOverviewState>(INACTIVE_STATE)

  useEffect(() => {
    let cancelled = false

    if (!active) {
      setState(INACTIVE_STATE)
      return () => {
        cancelled = true
      }
    }

    if (!idMunicipality) {
      setState({ status: 'absent', data: null, idMunicipality: null })
      return () => {
        cancelled = true
      }
    }

    setState({ status: 'loading', data: null, idMunicipality })
    void municipalEducationOverviewLoader.load(idMunicipality).then((data) => {
      if (!cancelled) setState({ status: 'ready', data, idMunicipality })
    }).catch(() => {
      if (cancelled) return
      try {
        const nextState = municipalEducationOverviewLoader.getState(idMunicipality)
        setState({ status: nextState.status, data: null, idMunicipality })
      } catch {
        setState({ status: 'error', data: null, idMunicipality })
      }
    })

    return () => {
      cancelled = true
    }
  }, [active, idMunicipality])

  if (!active) return INACTIVE_STATE
  if (!idMunicipality) return { status: 'absent', data: null, idMunicipality: null }
  if (state.idMunicipality !== idMunicipality) {
    return { status: 'loading', data: null, idMunicipality }
  }
  return state
}
