import { buildAppHash } from '../app/appHash.js'
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
