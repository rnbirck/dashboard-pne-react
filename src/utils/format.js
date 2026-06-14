export function getDisplayValue(display, key, fallback = '-') {
  return display?.[key] ?? fallback
}

export function getCategoryItems(indicadores, cycle, categoryKey) {
  const categories = indicadores?.cycles?.[cycle]?.categories ?? []
  return categories.find((category) => category.key === categoryKey)?.items ?? []
}

export function getCycleCategories(indicadores, cycle) {
  return indicadores?.cycles?.[cycle]?.categories ?? []
}

export function findFirstAvailableCategory(categories) {
  return categories[0]?.key ?? ''
}

export function getIndicatorTitle(item, result) {
  return item?.label || result?.label || 'Indicador'
}

export function cleanInterpretationText(text) {
  if (typeof text !== 'string' || !text.length) return text
  let cleaned = text.replace(/\bp\.p\.\.+/g, 'p.p.')
  cleaned = cleaned.replace(/\.+\s*$/, '.')
  cleaned = cleaned.replace(/(\b\w)\.([a-zÀ-ÿ])/g, '$1. $2')
  return cleaned.trimEnd()
}
