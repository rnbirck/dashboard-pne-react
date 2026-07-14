import { useCallback, useEffect, useState } from 'react'
import { getEducationSectionFromLocation } from '../data/educationIndicatorCatalog'
import { getActivePageFromLocation } from '../app/appRoutes'

export function useAppHashNavigation() {
  const [activePage, setActivePage] = useState(getActivePageFromLocation)
  const [activeEducationSection, setActiveEducationSection] = useState(
    () => getEducationSectionFromLocation(),
  )

  const refreshNavigation = useCallback(() => {
    setActivePage(getActivePageFromLocation())
    setActiveEducationSection(getEducationSectionFromLocation())
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', refreshNavigation)
    return () => window.removeEventListener('hashchange', refreshNavigation)
  }, [refreshNavigation])

  const navigate = useCallback((page) => {
    const nextHash = `#${page}`
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    } else {
      refreshNavigation()
    }
  }, [refreshNavigation])

  return {
    activeEducationSection,
    activePage,
    navigate,
  }
}
