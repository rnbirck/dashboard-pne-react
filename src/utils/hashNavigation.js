export function getHashContext() {
  if (typeof window === 'undefined') return { params: new URLSearchParams(), route: '' }
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [route, query = ''] = raw.split('?')
  return { params: new URLSearchParams(query), route }
}

export function setHashContext(route, values = {}) {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  const query = params.toString()
  window.location.hash = `${route}${query ? `?${query}` : ''}`
}
