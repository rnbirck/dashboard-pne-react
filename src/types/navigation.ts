import type { AppPageKey, FinancialPageKey } from './app'

export type { AppPageKey, FinancialPageKey }

export type HashParameterValue = string | number | boolean | null | undefined
export type HashParameterMap = Record<string, HashParameterValue>

export interface LocationLike {
  hash?: string
  search?: string
}

export interface ParsedHash {
  hashParams: URLSearchParams
  params: URLSearchParams
  rawRoute: string
  route: string
}

export interface ParsedAppLocation extends ParsedHash {
  searchParams: URLSearchParams
}

export type BuildAppHash = (route: string, values?: HashParameterMap) => string
export type Navigate = (page: AppPageKey) => void
