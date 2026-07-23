import { useMemo } from 'react'
import { loadMunicipioData, primeMunicipioCache } from '../data/staticData'
import type { AsyncDataState } from '../types/async'
import type { MunicipioData, MunicipioIndexEntry, MunicipioName } from '../types/data'
import { useAsyncData } from '../utils/useAsyncData'

function findMunicipioEntry(
  municipiosIndex: MunicipioIndexEntry[],
  selectedMunicipio: MunicipioName | null,
): MunicipioIndexEntry | null {
  return municipiosIndex.find((item) => item.nome === selectedMunicipio) ?? null
}

export function useMunicipioData(
  municipiosIndex: MunicipioIndexEntry[],
  selectedMunicipio: MunicipioName | null,
): AsyncDataState<MunicipioData | null> {
  const selectedMunicipioEntry = useMemo(
    () => findMunicipioEntry(municipiosIndex, selectedMunicipio),
    [municipiosIndex, selectedMunicipio],
  )

  return useAsyncData(
    async () => {
      if (!selectedMunicipioEntry?.slug) {
        return null
      }

      const data = await loadMunicipioData(selectedMunicipioEntry.slug)
      primeMunicipioCache(selectedMunicipioEntry.slug, data)
      return data
    },
    [selectedMunicipioEntry?.slug],
  )
}
