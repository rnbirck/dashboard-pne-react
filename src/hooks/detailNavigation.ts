export interface DetailNavigationItem {
  key: string
}

export interface DetailSequence<T extends DetailNavigationItem> {
  activeIndex: number
  previousItem: T | null
  nextItem: T | null
}

export function resolveDetailSequence<T extends DetailNavigationItem>(
  items: T[],
  activeKey?: string,
): DetailSequence<T> {
  const activeIndex = items.findIndex((item) => item.key === activeKey)
  return {
    activeIndex,
    previousItem: activeIndex > 0 ? items[activeIndex - 1] : null,
    nextItem: activeIndex >= 0 && activeIndex < items.length - 1 ? items[activeIndex + 1] : null,
  }
}
