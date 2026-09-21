import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCourses } from '../hooks/useCourses'
import { useLocalDone } from '../hooks/useLocalDone'
import { supabase } from '../lib/supabase'
import { courseColorFor } from '../lib/courseColors'
import { formatDueDate } from '../lib/dates'
import { isSafeHttpUrl } from '../lib/url'
import type { Task, TaskAttachment, Course } from '../types'

interface TaskDetail extends Task {
  courses: Pick<Course, 'id' | 'name'> | null
  task_attachments: TaskAttachment[]
}

export function TaskDetailView() {
  const { id } = useParams<{ id: string }>()
  const { courses } = useCourses()
  const { isDone, toggle } = useLocalDone()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*, courses(id, name, short_name), task_attachments(*)')
          .eq('id', id)
          .single()

        if (cancelled) return
        if (error) setError(error.message)
        else setTask(data as unknown as TaskDetail)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo conectar.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <p className="p-6 text-sm text-muted">Cargando…</p>
  if (error) return <p className="p-6 text-sm text-red-600">Error: {error}</p>
  if (!task) return <p className="p-6 text-sm text-muted">No se encontró la tarea.</p>

  const color = courseColorFor(courses, task.course_id)
  const done = isDone(task.id)

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <div className="px-4 pb-6 pt-5" style={{ background: color.bg, color: color.fg }}>
        <div className="flex items-center justify-between">
          <Link
            to="/tareas"
            aria-label="Volver"
            className="grid h-10 w-10 place-items-center rounded-full bg-ink text-cream no-underline"
          >
            ‹
          </Link>
          <span className="rounded-full bg-white/55 px-3 py-2 text-xs font-bold uppercase tracking-wide text-ink">
            {task.courses?.name ?? 'Curso'}
          </span>
        </div>
        <h1 className="font-display mt-4.5 text-[31px] font-extrabold leading-tight tracking-tight">{task.title}</h1>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-ink px-3.5 py-2 text-[13px] font-bold text-cream">
            {done ? 'Hecha' : `Vence ${formatDueDate(task.due_date)}`}
          </span>
          <span className="rounded-full bg-white/55 px-3.5 py-2 text-[13px] font-bold text-ink">
            {done ? 'Marcada como hecha' : 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pb-4 pt-5">
        {task.description && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Descripción</div>
            <p className="text-[15px] leading-relaxed text-ink">{task.description}</p>
          </div>
        )}

        {task.links.filter(isSafeHttpUrl).length > 0 && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Enlaces</div>
            <div className="flex flex-col gap-2">
              {task.links.filter(isSafeHttpUrl).map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-[18px] border-2 border-ink bg-white px-4 py-3.5 text-[14px] font-medium text-ink no-underline"
                >
                  <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-lg bg-teal text-xs font-bold text-cream">
                    ↗
                  </span>
                  <span className="min-w-0 flex-1 truncate">{link}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {task.task_attachments.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Adjunto</div>
            {task.task_attachments[0].file_type === 'image' ? (
              <a href={task.task_attachments[0].file_url} target="_blank" rel="noreferrer">
                <img
                  src={task.task_attachments[0].file_url}
                  alt=""
                  className="w-full rounded-[20px] border-2 border-ink object-cover"
                />
              </a>
            ) : (
              <a
                href={task.task_attachments[0].file_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-[18px] border-2 border-ink bg-white px-4 py-3.5 text-[14px] font-medium text-ink no-underline"
              >
                <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-lg bg-teal text-xs font-bold text-cream">
                  ↗
                </span>
                Ver PDF
              </a>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => toggle(task.id)}
            className="font-display rounded-full py-4 text-center text-[17px] font-extrabold text-cream"
            style={{ background: done ? '#1E2B2B' : '#069494' }}
          >
            {done ? 'Marcar como pendiente' : 'Marcar como hecho'}
          </button>
          <div className="text-center text-xs text-muted">Se guarda solo en este dispositivo</div>
        </div>
      </div>
    </div>
  )
}
