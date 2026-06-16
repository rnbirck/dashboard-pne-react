import { useEffect, useRef, useState } from 'react'

export function useAsyncData(factory, dependencies) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: true,
  })
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  useEffect(() => {
    let cancelled = false
    setState({ data: null, error: null, loading: true })

    Promise.resolve()
      .then(() => factoryRef.current())
      .then((data) => {
        if (cancelled) return
        setState({ data: data ?? null, error: null, loading: false })
      })
      .catch((error) => {
        if (cancelled) return
        setState({
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
