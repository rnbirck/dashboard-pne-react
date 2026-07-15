import { useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'
import type { AsyncDataState } from '../types/async'

type AsyncDataFactory<T> = () => T | Promise<T>

export function useAsyncData<T>(
  factory: AsyncDataFactory<T>,
  dependencies: DependencyList,
): AsyncDataState<T | null> {
  const [state, setState] = useState<AsyncDataState<T | null>>({
    status: 'loading',
    data: null,
    error: null,
    loading: true,
  })
  const factoryRef = useRef<AsyncDataFactory<T>>(factory)
  factoryRef.current = factory

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading', data: null, error: null, loading: true })

    Promise.resolve()
      .then(() => factoryRef.current())
      .then((data) => {
        if (cancelled) return
        setState({ status: 'success', data: data ?? null, error: null, loading: false })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Erro inesperado.',
          loading: false,
        })
      })

    return () => {
      cancelled = true
    }
  // Dependencies are owned by callers so this helper can mirror useEffect's API.
  }, dependencies) // eslint-disable-line react-hooks/exhaustive-deps

  return state
}
