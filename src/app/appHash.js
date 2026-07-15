export function normalizeRouteValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
}

export function parseAppHash(hash) {
  const rawHash = String(hash ?? '').replace(/^#\/?/, '')
  const [rawRoute = '', rawQuery = ''] = rawHash.split('?')

  return {
    hashParams: new URLSearchParams(rawQuery),
    params: new URLSearchParams(rawQuery),
    rawRoute,
    route: normalizeRouteValue(rawRoute),
  }
}

export function mergeHashAndSearchParams(hashParams, searchParams) {
  const merged = new URLSearchParams(searchParams ?? '')
  new URLSearchParams(hashParams ?? '').forEach((value, key) => {
    merged.set(key, value)
  })
  return merged
}

export function parseAppLocation({ hash = '', search = '' } = {}) {
  const parsedHash = parseAppHash(hash)
  const searchParams = new URLSearchParams(search)

  return {
    ...parsedHash,
    params: mergeHashAndSearchParams(parsedHash.hashParams, searchParams),
    searchParams,
  }
}

export function buildAppHash(route, values = {}) {
  const normalizedRoute = String(route ?? '').replace(/^#\/?/, '')
  const params = new URLSearchParams()

  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  })

  const query = params.toString()
  return `#${normalizedRoute}${query ? `?${query}` : ''}`
}
