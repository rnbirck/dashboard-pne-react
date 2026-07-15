import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { MunicipioName } from '../types/data'

const STORAGE_KEY = 'pne_dashboard_municipio'

interface MunicipalityContextValue {
  selectedMunicipio: MunicipioName | null
  setSelectedMunicipio: (value: MunicipioName | null) => void
}

interface MunicipalityProviderProps extends PropsWithChildren {
  municipios: MunicipioName[]
}

const FALLBACK_MUNICIPALITY_CONTEXT: MunicipalityContextValue = {
  selectedMunicipio: null,
  setSelectedMunicipio: () => {},
}

const MunicipalityContext = createContext<MunicipalityContextValue | undefined>(undefined)

export function MunicipalityProvider({ children, municipios }: MunicipalityProviderProps) {
  const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipioName | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        return saved
      }
    } catch {
      return null
    }
    return null
  })

  const saveMunicipio = useCallback((value: MunicipioName | null) => {
    setSelectedMunicipio(value)
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, value)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // localStorage can be unavailable in restricted browser contexts.
    }
  }, [])

  useEffect(() => {
    if (municipios.length === 0) return

    if (selectedMunicipio && !municipios.includes(selectedMunicipio)) {
      setSelectedMunicipio(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // localStorage can be unavailable in restricted browser contexts.
      }
    }
  }, [municipios, selectedMunicipio])

  return (
    <MunicipalityContext.Provider
      value={{ selectedMunicipio, setSelectedMunicipio: saveMunicipio }}
    >
      {children}
    </MunicipalityContext.Provider>
  )
}

export function useMunicipality(): MunicipalityContextValue {
  const municipality = useContext(MunicipalityContext)
  if (!municipality) {
    if (import.meta.env.DEV) {
      throw new Error('useMunicipality deve ser usado dentro de MunicipalityProvider.')
    }
    return FALLBACK_MUNICIPALITY_CONTEXT
  }
  return municipality
}
