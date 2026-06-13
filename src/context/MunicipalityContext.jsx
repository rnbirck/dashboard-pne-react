import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'pne_dashboard_municipio'

const MunicipalityContext = createContext({
  selectedMunicipio: null,
  setSelectedMunicipio: () => {},
})

export function MunicipalityProvider({ children, municipios }) {
  const [selectedMunicipio, setSelectedMunicipio] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && municipios.includes(saved)) {
        return saved
      }
    } catch {}
    return null
  })

  const saveMunicipio = useCallback((value) => {
    setSelectedMunicipio(value)
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, value)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (selectedMunicipio && !municipios.includes(selectedMunicipio)) {
      setSelectedMunicipio(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {}
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

export function useMunicipality() {
  return useContext(MunicipalityContext)
}
