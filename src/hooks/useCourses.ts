import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Course } from '../types'

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true })

      if (error) setError(error.message)
      else setCourses(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { courses, loading, error, refresh }
}
