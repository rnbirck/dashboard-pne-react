import { useCallback, useEffect, useState } from 'react'
import { resolveEducationNavigation } from '../data/educationIndicatorCatalog'
import { getNavigationContextFromLocation, resolveActivePage } from '../app/appRoutes'
import { setHashContext } from '../utils/hashNavigation'

function getNavigationState(location = typeof window === 'undefined' ? null : window.location) {
  const navigationContext = getNavigationContextFromLocation(location)
  const educationNavigation = resolveEducationNavigation(navigationContext)

  return {
    activeEducationSection: educationNavigation?.section ?? null,
    activePage: resolveActivePage(navigationContext),
    educationNavigation,
    navigationContext,
  }
}

export function useAppHashNavigation() {
  const [navigationState, setNavigationState] = useState(getNavigationState)

  const refreshNavigation = useCallback(() => {
    setNavigationState(getNavigationState())
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', refreshNavigation)
    return () => window.removeEventListener('hashchange', refreshNavigation)
  }, [refreshNavigation])

  const navigate = useCallback((page) => {
    const nextHash = `#${page}`
    if (window.location.hash !== nextHash) {
      setHashContext(page)
    } else {
      refreshNavigation()
    }
  }, [refreshNavigation])

  return {
    ...navigationState,
    navigate,
  }
}
