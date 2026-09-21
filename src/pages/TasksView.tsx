import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListTaskCard } from '../components/TaskCard'
import { TaskFilters, type StatusFilter } from '../components/TaskFilters'
import { ViewToggle } from '../components/ViewToggle'
import { useCourses } from '../hooks/useCourses'
import { useLocalDone } from '../hooks/useLocalDone'
import { useTasks } from '../hooks/useTasks'
import { courseColorByIndex, courseColorFor } from '../lib/courseColors'
import { diffDays, formatDueDate } from '../lib/dates'
import type { Course, TaskWithCourse } from '../types'

function GridCourseCard({ course, index, tasks }: { course: Course; index: number; tasks: TaskWithCourse[] }) {
  const color = courseColorByIndex(index)
  const mine = tasks.filter((t) => t.course_id === course.id)
  const next = mine[0]

  return (
    <Link
      to={next ? `/tareas/${next.id}` : '/tareas'}
      className="flex min-h-[168px] flex-col justify-between rounded-[24px] p-4 no-underline"
      style={{ background: color.bg, color: color.fg }}
    >
      <div>
        <div className="font-display text-[40px] font-extrabold leading-none">{mine.length}</div>
        <div className="text-[12px] font-bold uppercase tracking-wide opacity-75">pendientes</div>
      </div>
      <div>
        <div className="font-display text-[17px] font-extrabold leading-tight">{course.name}</div>
        {next && (
          <span
            className="mt-1.5 inline-block rounded-full px-2.5 py-1 text-[12px] font-bold"
            style={{ background: '#1E2B2B', color: color.bg }}
          >
            {formatDueDate(next.due_date)}
          </span>
        )}
      </div>
    </Link>
  )
}

export function TasksView() {
  const { courses } = useCourses()
  const [search, setSearch] = useState('')
  const [courseId, setCourseId] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const { tasks, loading, error } = useTasks({ archived: false, courseId })
  const { isDone, toggle } = useLocalDone()

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.courses?.name ?? '').toLowerCase().includes(q),
    )
  }, [tasks, search])

  const pending = useMemo(() => searched.filter((t) => !isDone(t.id)), [searched, isDone])
  const done = useMemo(() => searched.filter((t) => isDone(t.id)), [searched, isDone])

  const dueSoon = useMemo(() => pending.filter((t) => diffDays(t.due_date) <= 0), [pending])
  const dueWeek = useMemo(() => pending.filter((t) => diffDays(t.due_date) >= 1 && diffDays(t.due_date) <= 7), [pending])
  const dueLater = useMemo(() => pending.filter((t) => diffDays(t.due_date) > 7), [pending])
  const pendingCount = pending.length

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 pt-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink">Tareas</h1>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === 'list' && (
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          courses={courses}
          courseId={courseId}
          onCourseChange={setCourseId}
          status={status}
          onStatusChange={setStatus}
        />
      )}

      {view === 'grid' && (
        <div className="flex gap-2">
          <span className="rounded-full bg-ink px-3.5 py-2 text-[13px] font-bold text-cream">
            {courses.length} curso{courses.length !== 1 ? 's' : ''}
          </span>
          <span className="rounded-full border-2 border-ink px-3.5 py-2 text-[13px] font-bold text-ink">
            Pendientes · {pendingCount}
          </span>
        </div>
      )}

      {loading && <p className="text-sm text-muted">Cargando…</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {courses.map((c, i) => (
            <GridCourseCard key={c.id} course={c} index={i} tasks={pending} />
          ))}
        </div>
      ) : (
        <>
          {!loading && !error && pending.length === 0 && done.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted">No hay tareas para mostrar.</p>
          )}

          {dueSoon.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Vence hoy</div>
              {dueSoon.map((t) => (
                <ListTaskCard key={t.id} task={t} color={courseColorFor(courses, t.course_id)} done={false} onToggleDone={toggle} />
              ))}
            </section>
          )}

          {dueWeek.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Esta semana</div>
              {dueWeek.map((t) => (
                <ListTaskCard key={t.id} task={t} color={courseColorFor(courses, t.course_id)} done={false} onToggleDone={toggle} />
              ))}
            </section>
          )}

          {dueLater.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Más adelante</div>
              {dueLater.map((t) => (
                <ListTaskCard key={t.id} task={t} color={courseColorFor(courses, t.course_id)} done={false} onToggleDone={toggle} />
              ))}
            </section>
          )}

          {status === 'all' && done.length > 0 && (
            <section className="flex flex-col gap-2.5">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Hechas (en este dispositivo)</div>
              {done.map((t) => (
                <ListTaskCard key={t.id} task={t} color={courseColorFor(courses, t.course_id)} done onToggleDone={toggle} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}
