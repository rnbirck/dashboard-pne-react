import { useCallback, useEffect, useRef } from 'react'
export { resolveDetailSequence } from './detailNavigation.js'

export function useDetailViewNavigation({ activeKey, isOpen }) {
  const cardRefsRef = useRef(new Map())
  const detailViewRef = useRef(null)
  const gridScrollYRef = useRef(0)
  const shouldFocusDetailRef = useRef(false)

  useEffect(() => {
    if (!isOpen || !activeKey || !shouldFocusDetailRef.current) return undefined

    shouldFocusDetailRef.current = false
    const frame = window.requestAnimationFrame(() => {
      const detailView = detailViewRef.current
      if (!detailView) return

      detailView.scrollIntoView({ block: 'start', behavior: 'auto' })
      const detailTitle = detailView.querySelector('[data-detail-title]')
      if (detailTitle instanceof HTMLElement) {
        detailTitle.classList.add('programmatic-focus-target')
        detailTitle.focus({ preventScroll: true })
      }
    })

    return () => window.cancelAnimationFrame(frame)
  }, [activeKey, isOpen])

  const prepareDetail = useCallback((itemKey, { captureGridPosition = false } = {}) => {
    if (captureGridPosition) {
      gridScrollYRef.current = window.scrollY
    }
    shouldFocusDetailRef.current = true
    return itemKey
  }, [])

  const registerCard = useCallback((itemKey, node) => {
    if (node) {
      cardRefsRef.current.set(itemKey, node)
    } else {
      cardRefsRef.current.delete(itemKey)
    }
  }, [])

  const restoreGrid = useCallback((itemKey) => {
    const scrollTop = gridScrollYRef.current
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollTop, behavior: 'auto' })
      window.requestAnimationFrame(() => {
        cardRefsRef.current.get(itemKey)?.focus({ preventScroll: true })
        window.scrollTo({ top: scrollTop, behavior: 'auto' })
      })
    })
  }, [])

  return {
    detailViewRef,
    prepareDetail,
    registerCard,
    restoreGrid,
  }
}
