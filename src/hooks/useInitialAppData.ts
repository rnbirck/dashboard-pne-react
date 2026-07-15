import { useEffect, useState } from 'react'
import { loadIndicadores, loadMunicipios, loadMunicipiosIndex } from '../data/staticData'
import type { InitialAppData } from '../types/data'

const INITIAL_APP_DATA: InitialAppData = {
  status: 'loading',
  error: null,
  indicadores: null,
  loading: true,
  municipios: [],
  municipiosIndex: [],
}

export function useInitialAppData(): InitialAppData {
  const [initialData, setInitialData] = useState<InitialAppData>(INITIAL_APP_DATA)

  useEffect(() => {
    let cancelled = false

    async function loadInitialData(): Promise<void> {
      try {
        const [municipiosPayload, indicadoresPayload, municipiosIndexPayload] =
          await Promise.all([loadMunicipios(), loadIndicadores(), loadMunicipiosIndex()])
        const municipios = municipiosPayload.municipios ?? []
        const municipiosIndex = municipiosIndexPayload.municipios ?? []

        if (!cancelled) {
          setInitialData({
            status: 'success',
            error: null,
            indicadores: indicadoresPayload,
            loading: false,
            municipios,
            municipiosIndex,
          })
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setInitialData({
            status: 'error',
            error: error instanceof Error ? error.message : 'Erro inesperado.',
            indicadores: null,
            loading: false,
            municipios: [],
            municipiosIndex: [],
          })
        }
      }
    }

    void loadInitialData()

    return () => {
      cancelled = true
    }
  }, [])

  return initialData
}
