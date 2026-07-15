import { useCallback, useEffect, useState } from 'react'
import { getNavigationContextFromLocation, resolveActivePage } from '../app/appRoutes'
import { resolveEducationNavigation } from '../data/educationIndicatorCatalog'
import type { AppPageKey } from '../types/app'
import type { LocationLike, Navigate, ParsedAppLocation } from '../types/navigation'
import { setHashContext } from '../utils/hashNavigation'

interface EducationNavigation {
  section?: string
}

interface NavigationState {
  activeEducationSection: string | null
  activePage: AppPageKey
  educationNavigation: EducationNavigation | null
  navigationContext: ParsedAppLocation
}

export interface AppHashNavigation extends NavigationState {
  navigate: Navigate
}

function getNavigationState(
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
): NavigationState {
  const navigationContext = getNavigationContextFromLocation(location)
  const educationNavigation: EducationNavigation | null = resolveEducationNavigation(navigationContext)

  return {
    activeEducationSection: educationNavigation?.section ?? null,
    activePage: resolveActivePage(navigationContext),
    educationNavigation,
    navigationContext,
  }
}

export function useAppHashNavigation(): AppHashNavigation {
  const [navigationState, setNavigationState] = useState<NavigationState>(getNavigationState)

  const refreshNavigation = useCallback(() => {
    setNavigationState(getNavigationState())
  }, [])

  useEffect(() => {
    window.addEventListener('hashchange', refreshNavigation)
    return () => window.removeEventListener('hashchange', refreshNavigation)
  }, [refreshNavigation])

  const navigate = useCallback<Navigate>((page) => {
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
