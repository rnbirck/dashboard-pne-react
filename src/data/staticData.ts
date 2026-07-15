import type {
  IndicadoresPayload,
  MunicipioData,
  MunicipiosIndexPayload,
  MunicipiosPayload,
} from '../types/data'

type JsonObject = Record<string, unknown>

const dataCache = new Map<string, unknown>()
const pendingCache = new Map<string, Promise<unknown>>()

export function loadJson<T>(path: string): Promise<T> {
  if (dataCache.has(path)) {
    // The cache is keyed by the complete path, so this is the single typed boundary for cached JSON.
    return Promise.resolve(dataCache.get(path) as T)
  }

  if (pendingCache.has(path)) {
    // A pending request for the same path has the same public payload contract.
    return pendingCache.get(path) as Promise<T>
  }

  const promise: Promise<T> = fetch(path)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar ${path} (${response.status})`)
      }
      // JSON is untrusted at this boundary; detailed runtime validation is intentionally deferred.
      const data = await response.json() as T
      dataCache.set(path, data)
      return data
    })
    .catch((error: unknown) => {
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

export function loadMunicipios(): Promise<MunicipiosPayload> {
  return loadJson<MunicipiosPayload>('/data/municipios.json')
}

export function loadIndicadores(): Promise<IndicadoresPayload> {
  return loadJson<IndicadoresPayload>('/data/indicadores.json')
}

export function loadMunicipiosIndex(): Promise<MunicipiosIndexPayload> {
  return loadJson<MunicipiosIndexPayload>('/data/municipios_index.json')
}

export function loadMunicipioData(slug: string): Promise<MunicipioData> {
  return loadJson<MunicipioData>(`/data/municipios/${slug}/index.json`)
}

export function loadMunicipioDetails(slug: string): Promise<JsonObject> {
  if (!slug) return Promise.resolve({})
  return loadJson<JsonObject>(`/data/municipios/${slug}/details.json`).catch(() => ({}))
}

export function loadIndicatorDetail(slug: string, indicatorKey: string): Promise<unknown | null> {
  if (!indicatorKey) return Promise.resolve(null)
  return loadMunicipioDetails(slug).then((details) => details[indicatorKey] ?? null)
}

export function loadPneStateReference(cycle = 'pne_2026_2036'): Promise<unknown> {
  return loadJson<unknown>(`/data/${cycle}/referencia_estadual.json`)
}

export function primeMunicipioCache(slug: string, data: MunicipioData): void {
  if (!slug) return
  dataCache.set(`/data/municipios/${slug}/index.json`, data)
}

export function loadMunicipioSharedInfo(slug: string, sectionKey: string): Promise<unknown | null> {
  if (!slug || !sectionKey) return Promise.resolve(null)
  return loadJson<JsonObject>(`/data/municipios/${slug}/details.json`).then(
    (details) => {
      const shared = details._shared
      return shared && typeof shared === 'object'
        ? (shared as JsonObject)[sectionKey] ?? null
        : null
    },
    () => null,
  )
}
