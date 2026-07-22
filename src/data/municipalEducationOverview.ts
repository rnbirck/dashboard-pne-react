import type { MunicipalEducationOverviewV1 } from '../features/education/municipalEducationOverviewTypes'

export const MUNICIPAL_EDUCATION_OVERVIEW_SCHEMA_VERSION = 'municipal-education-overview-v1' as const

export type MunicipalEducationOverviewLoadStatus = 'idle' | 'loading' | 'ready' | 'absent' | 'error'

export type MunicipalEducationOverviewLoadErrorCode =
  | 'invalid_identifier'
  | 'contract_absent'
  | 'http_error'
  | 'invalid_contract'

export class MunicipalEducationOverviewLoadError extends Error {
  readonly code: MunicipalEducationOverviewLoadErrorCode

  constructor(code: MunicipalEducationOverviewLoadErrorCode, message: string) {
    super(message)
    this.name = 'MunicipalEducationOverviewLoadError'
    this.code = code
  }
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

interface MunicipalEducationOverviewLoadState {
  status: MunicipalEducationOverviewLoadStatus
  data: MunicipalEducationOverviewV1 | null
}

export function normalizeMunicipalEducationOverviewSlug(slug: string): string {
  const normalized = slug.trim().toLocaleLowerCase('pt-BR')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new MunicipalEducationOverviewLoadError('invalid_identifier', 'Município inválido para a visão geral da educação.')
  }
  return normalized
}

export function resolveMunicipalEducationOverviewPath(slug: string): string {
  return `/data/educacao/visao-geral-municipal/${normalizeMunicipalEducationOverviewSlug(slug)}.json`
}

export function isMunicipalEducationOverviewDocument(
  payload: unknown,
  expectedSlug: string,
): payload is MunicipalEducationOverviewV1 {
  if (!payload || typeof payload !== 'object') return false

  const candidate = payload as Partial<MunicipalEducationOverviewV1>
  return candidate.schemaVersion === MUNICIPAL_EDUCATION_OVERVIEW_SCHEMA_VERSION
    && candidate.reference?.year === 2025
    && Boolean(candidate.municipality)
    && typeof candidate.municipality?.idMunicipality === 'string'
    && typeof candidate.municipality?.name === 'string'
    && candidate.municipality?.slug === expectedSlug
    && Boolean(candidate.basicEducationComposition?.components)
    && Boolean(candidate.specialEducation)
    && Boolean(candidate.highSchool?.total?.byNetwork)
    && Boolean(candidate.highSchool?.total?.bySchoolLocation)
    && candidate.schoolPerformance?.referenceYear === 2025
}

export function createMunicipalEducationOverviewLoader(fetchImpl: FetchLike = fetch) {
  const cache = new Map<string, Promise<MunicipalEducationOverviewV1>>()
  const states = new Map<string, MunicipalEducationOverviewLoadState>()

  function getState(slug: string): MunicipalEducationOverviewLoadState {
    const normalizedSlug = normalizeMunicipalEducationOverviewSlug(slug)
    return states.get(normalizedSlug) ?? { status: 'idle', data: null }
  }

  function load(slug: string): Promise<MunicipalEducationOverviewV1> {
    const normalizedSlug = normalizeMunicipalEducationOverviewSlug(slug)
    const cached = cache.get(normalizedSlug)
    if (cached) return cached

    states.set(normalizedSlug, { status: 'loading', data: null })
    const request = (async () => {
      try {
        const response = await fetchImpl(resolveMunicipalEducationOverviewPath(normalizedSlug))
        if (response.status === 404) {
          throw new MunicipalEducationOverviewLoadError('contract_absent', 'Visão geral municipal indisponível.')
        }
        if (!response.ok) {
          throw new MunicipalEducationOverviewLoadError('http_error', 'Falha ao carregar a visão geral municipal.')
        }

        let payload: unknown
        try {
          payload = await response.json()
        } catch {
          throw new MunicipalEducationOverviewLoadError('invalid_contract', 'A visão geral municipal não contém JSON válido.')
        }

        if (!isMunicipalEducationOverviewDocument(payload, normalizedSlug)) {
          throw new MunicipalEducationOverviewLoadError('invalid_contract', 'A visão geral municipal é incompatível.')
        }

        states.set(normalizedSlug, { status: 'ready', data: payload })
        return payload
      } catch (error) {
        cache.delete(normalizedSlug)
        const normalizedError = error instanceof MunicipalEducationOverviewLoadError
          ? error
          : new MunicipalEducationOverviewLoadError('http_error', 'Falha ao carregar a visão geral municipal.')
        states.set(normalizedSlug, {
          status: normalizedError.code === 'contract_absent' ? 'absent' : 'error',
          data: null,
        })
        throw normalizedError
      }
    })()

    cache.set(normalizedSlug, request)
    return request
  }

  return { getState, load }
}

export const municipalEducationOverviewLoader = createMunicipalEducationOverviewLoader()
