import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'unihm:done-tasks'

function readStore(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

export function useLocalDone() {
  const [done, setDone] = useState<Set<string>>(() => readStore())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
    } catch {
      // localStorage unavailable (private mode, quota) — done state
      // just won't persist across reloads for this device.
    }
  }, [done])

  const toggle = useCallback((taskId: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  const isDone = useCallback((taskId: string) => done.has(taskId), [done])

  return { isDone, toggle }
}
