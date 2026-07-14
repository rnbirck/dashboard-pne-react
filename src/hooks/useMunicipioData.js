import { useMemo } from 'react'
import { loadMunicipioData, primeMunicipioCache } from '../data/staticData'
import { useAsyncData } from '../utils/useAsyncData'

export function findMunicipioEntry(municipiosIndex, selectedMunicipio) {
  return municipiosIndex.find((item) => item.nome === selectedMunicipio) ?? null
}

export function useMunicipioData(municipiosIndex, selectedMunicipio) {
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
