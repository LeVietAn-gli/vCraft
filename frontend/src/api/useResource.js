import { useState, useEffect } from 'react'
import { apiFetch } from './client.js'

export function useResource(path) {
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    apiFetch(path, { signal }).then(
      ({ data, meta }) => {
        if (!signal.aborted) setResult({ path, revision, data, meta })
      },
      (error) => {
        if (!signal.aborted) setResult({ path, revision, error })
      },
    )
    return () => controller.abort()
  }, [path, revision])
  return {
    ...(result?.path === path && result.revision === revision ? result : {}),
    reload: () => setRevision((value) => value + 1),
  }
}
