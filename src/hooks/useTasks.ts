import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { TaskWithCourse } from '../types'

interface UseTasksOptions {
  archived?: boolean
  courseId?: string | null
}

export function useTasks({ archived = false, courseId = null }: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<TaskWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('tasks')
        .select('*, courses(id, name, short_name), task_attachments(id, file_type)')
        .eq('archived', archived)
        .order('due_date', { ascending: true })

      if (courseId) query = query.eq('course_id', courseId)

      const { data, error } = await query

      if (error) setError(error.message)
      else setTasks((data as unknown as TaskWithCourse[]) ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar.')
    } finally {
      setLoading(false)
    }
  }, [archived, courseId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { tasks, loading, error, refresh }
}
