import { useEffect, useState } from 'react'
import { loadIndicadores, loadMunicipios, loadMunicipiosIndex } from '../data/staticData'

const INITIAL_APP_DATA = {
  error: null,
  indicadores: null,
  loading: true,
  municipios: [],
  municipiosIndex: [],
}

export function useInitialAppData() {
  const [initialData, setInitialData] = useState(INITIAL_APP_DATA)

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      try {
        const [municipiosPayload, indicadoresPayload, municipiosIndexPayload] =
          await Promise.all([loadMunicipios(), loadIndicadores(), loadMunicipiosIndex()])
        const municipios = municipiosPayload.municipios ?? []
        const municipiosIndex = municipiosIndexPayload.municipios ?? []

        if (!cancelled) {
          setInitialData({
            error: null,
            indicadores: indicadoresPayload,
            loading: false,
            municipios,
            municipiosIndex,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setInitialData({
            error: error instanceof Error ? error.message : 'Erro inesperado.',
            indicadores: null,
            loading: false,
            municipios: [],
            municipiosIndex: [],
          })
        }
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
  }, [])

  return initialData
}
