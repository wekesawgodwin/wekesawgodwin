import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

// Public GET responses are cached for the session so moving between pages is
// instant; each mount still revalidates in the background.
const cache = new Map()

export function useApi(path, { auth = false, cache: useCache = !auth } = {}) {
  const cached = useCache && path ? cache.get(path) : undefined
  const [state, setState] = useState({
    data: cached ?? null,
    error: null,
    loading: Boolean(path) && cached === undefined,
  })
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (!path) return undefined
    let cancelled = false
    const hit = useCache ? cache.get(path) : undefined
    setState({ data: hit ?? null, error: null, loading: hit === undefined })
    api(path, { auth }).then(
      (data) => {
        if (useCache) cache.set(path, data)
        if (!cancelled) setState({ data, error: null, loading: false })
      },
      (error) => {
        if (!cancelled) setState((s) => ({ data: s.data, error, loading: false }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [path, auth, useCache, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { ...state, reload }
}

export function invalidate(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
