import { buildAppHash } from '../app/appHash.js'
import { getNavigationContextFromLocation } from '../app/appRoutes.js'

export function getHashContext(location = typeof window === 'undefined' ? null : window.location) {
  if (!location) return { params: new URLSearchParams(), route: '' }
  const { params, rawRoute } = getNavigationContextFromLocation(location)
  return { params, route: rawRoute }
}

export function setHashContext(route, values = {}, location = typeof window === 'undefined' ? null : window.location) {
  if (!location) return
  location.hash = buildAppHash(route, values)
}
