import { useEffect, useState } from 'react'
import {
  municipalEducationOverviewLoader,
  type MunicipalEducationOverviewLoadStatus,
} from '../../../data/municipalEducationOverview'
import type { MunicipalEducationOverviewV1 } from '../municipalEducationOverviewTypes'

export interface MunicipalEducationOverviewState {
  status: MunicipalEducationOverviewLoadStatus
  data: MunicipalEducationOverviewV1 | null
  slug: string | null
}

const INACTIVE_STATE: MunicipalEducationOverviewState = {
  status: 'idle',
  data: null,
  slug: null,
}

export function useMunicipalEducationOverview(
  slug: string | null | undefined,
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

    if (!slug) {
      setState({ status: 'absent', data: null, slug: null })
      return () => {
        cancelled = true
      }
    }

    setState({ status: 'loading', data: null, slug })
    void municipalEducationOverviewLoader.load(slug).then((data) => {
      if (!cancelled) setState({ status: 'ready', data, slug })
    }).catch(() => {
      if (cancelled) return
      try {
        const nextState = municipalEducationOverviewLoader.getState(slug)
        setState({ status: nextState.status, data: null, slug })
      } catch {
        setState({ status: 'error', data: null, slug })
      }
    })

    return () => {
      cancelled = true
    }
  }, [active, slug])

  if (!active) return INACTIVE_STATE
  if (!slug) return { status: 'absent', data: null, slug: null }
  if (state.slug !== slug) return { status: 'loading', data: null, slug }
  return state
}
