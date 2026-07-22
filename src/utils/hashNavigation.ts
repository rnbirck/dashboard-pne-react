import { buildAppHash, parseAppLocation } from '../app/appHash.js'
import { getNavigationContextFromLocation } from '../app/appRoutes.js'
import type { HashParameterMap, LocationLike } from '../types/navigation'

export interface HashContext {
  params: URLSearchParams
  route: string
}

export function getHashContext(
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
): HashContext {
  if (!location) return { params: new URLSearchParams(), route: '' }
  const { params, rawRoute } = getNavigationContextFromLocation(location)
  return { params, route: rawRoute }
}

export function setHashContext(
  route: string,
  values: HashParameterMap = {},
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
): void {
  if (!location) return
  location.hash = buildAppHash(route, values)
}

function buildMergedHash(
  route: string,
  values: HashParameterMap,
  location: LocationLike,
): string {
  const params = new URLSearchParams(parseAppLocation(location).hashParams)

  Object.entries(values).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      params.delete(key)
      return
    }
    params.set(key, String(value))
  })

  return buildAppHash(route, Object.fromEntries(params))
}

export function mergeHashContext(
  route: string,
  values: HashParameterMap = {},
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
): void {
  if (!location) return
  location.hash = buildMergedHash(route, values, location)
}

export function replaceHashContext(
  route: string,
  values: HashParameterMap = {},
  location: LocationLike | null = typeof window === 'undefined' ? null : window.location,
): void {
  if (!location) return
  const nextHash = buildMergedHash(route, values, location)

  if (typeof window !== 'undefined' && location === window.location && window.history?.replaceState) {
    if (window.location.hash === nextHash) return
    window.history.replaceState(null, '', nextHash)
    window.dispatchEvent(new Event('hashchange'))
    return
  }

  location.hash = nextHash
}
