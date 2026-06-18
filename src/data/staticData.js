const dataCache = new Map()
const pendingCache = new Map()

export function loadJson(path) {
  if (dataCache.has(path)) {
    return Promise.resolve(dataCache.get(path))
  }

  if (pendingCache.has(path)) {
    return pendingCache.get(path)
  }

  const promise = fetch(path)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar ${path} (${response.status})`)
      }
      const data = await response.json()
      dataCache.set(path, data)
      return data
    })
    .catch((error) => {
      throw error instanceof Error
        ? error
        : new Error(`Erro ao carregar ${path}: ${String(error)}`)
    })
    .finally(() => {
      pendingCache.delete(path)
    })

  pendingCache.set(path, promise)
  return promise
}

export function loadMunicipios() {
  return loadJson('/data/municipios.json')
}

export function loadIndicadores() {
  return loadJson('/data/indicadores.json')
}

export function loadMunicipiosIndex() {
  return loadJson('/data/municipios_index.json')
}

export function loadMunicipioData(slug) {
  return loadJson(`/data/municipios/${slug}/index.json`)
}

export function loadIndicatorDetail(slug, indicatorKey) {
  return loadJson(`/data/municipios/${slug}/details/${indicatorKey}.json`)
}

export function primeMunicipioCache(slug, data) {
  if (!slug) return
  dataCache.set(`/data/municipios/${slug}/index.json`, data)
}
