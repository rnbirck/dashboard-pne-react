import type {
  BuildAppHash,
  HashParameterMap,
  LocationLike,
  ParsedAppLocation,
  ParsedHash,
} from '../types/navigation'

export function normalizeRouteValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]/g, '')
}

export function parseAppHash(hash?: unknown): ParsedHash {
  const rawHash = String(hash ?? '').replace(/^#\/?/, '')
  const [rawRoute = '', rawQuery = ''] = rawHash.split('?')

  return {
    hashParams: new URLSearchParams(rawQuery),
    params: new URLSearchParams(rawQuery),
    rawRoute,
    route: normalizeRouteValue(rawRoute),
  }
}

export function mergeHashAndSearchParams(
  hashParams?: URLSearchParams | string,
  searchParams?: URLSearchParams | string,
): URLSearchParams {
  const merged = new URLSearchParams(searchParams ?? '')
  new URLSearchParams(hashParams ?? '').forEach((value, key) => {
    merged.set(key, value)
  })
  return merged
}

export function parseAppLocation(location: LocationLike = {}): ParsedAppLocation {
  const parsedHash = parseAppHash(location.hash)
  const searchParams = new URLSearchParams(location.search)

  return {
    ...parsedHash,
    params: mergeHashAndSearchParams(parsedHash.hashParams, searchParams),
    searchParams,
  }
}

export const buildAppHash: BuildAppHash = (route, values: HashParameterMap = {}) => {
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
