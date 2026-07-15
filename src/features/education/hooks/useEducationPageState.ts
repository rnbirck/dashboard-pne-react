import { useLayoutEffect, useState } from 'react'
import { useDetailViewNavigation } from '../../../hooks/useDetailViewNavigation'
import type { EducationNavigationState } from '../educationTypes'

export function useEducationPageState(currentNavigation: EducationNavigationState) {
  const [selectedSectionKey, setSelectedSectionKey] = useState(currentNavigation.section)
  const [selectedThemeKey, setSelectedThemeKey] = useState(currentNavigation.panoramaTheme)
  const [selectedIndicatorKey, setSelectedIndicatorKey] = useState(currentNavigation.detailKey)
  const [isDetailOpen, setIsDetailOpen] = useState(Boolean(currentNavigation.detailKey))
  const [searchQuery, setSearchQuery] = useState('')
  const detailNavigation = useDetailViewNavigation({ activeKey: selectedIndicatorKey, isOpen: isDetailOpen })

  useLayoutEffect(() => {
    const sectionChanged = currentNavigation.section !== selectedSectionKey
    const themeChanged = currentNavigation.shouldApplyTheme && currentNavigation.panoramaTheme !== selectedThemeKey
    setSelectedSectionKey(currentNavigation.section)
    if (currentNavigation.shouldApplyTheme) setSelectedThemeKey(currentNavigation.panoramaTheme)
    if (sectionChanged || themeChanged) setSearchQuery('')
    setSelectedIndicatorKey(currentNavigation.detailKey)
    setIsDetailOpen(Boolean(currentNavigation.detailKey))
  }, [currentNavigation, selectedSectionKey, selectedThemeKey])

  return {
    detailNavigation,
    isDetailOpen,
    searchQuery,
    selectedIndicatorKey,
    selectedSectionKey,
    selectedThemeKey,
    setIsDetailOpen,
    setSearchQuery,
    setSelectedIndicatorKey,
    setSelectedSectionKey,
    setSelectedThemeKey,
  }
}
