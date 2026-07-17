import { useEffect, useRef, useState } from 'react'

export function useChartViewport(fallbackWidth = 640) {
  const containerRef = useRef(null)
  const [width, setWidth] = useState(fallbackWidth)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    const updateWidth = () => {
      const styles = window.getComputedStyle(element)
      const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight)
      const contentWidth = element.clientWidth - (Number.isFinite(horizontalPadding) ? horizontalPadding : 0)
      const nextWidth = Math.max(180, Math.round(contentWidth))
      setWidth((currentWidth) => currentWidth === nextWidth ? currentWidth : nextWidth)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { containerRef, width }
}
