import { useState, useEffect, useCallback, useRef } from 'react'

/*
  Usage:
    const { data, loading, error, refetch } = useApi(() => dashboardApi.getStudent())

  With deps (re-fetches when period changes):
    const { data } = useApi(() => financeApi.getSummary(period), [period])
*/
export function useApi(fetchFn, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fnRef = useRef(fetchFn)
  fnRef.current = fetchFn

  const run = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fnRef.current()
      .then(d  => { if (!cancelled) { setData(d);         setLoading(false) } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => run(), [run])

  return { data, loading, error, refetch: run }
}
