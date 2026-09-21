import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FeaturedTaskCard } from '../components/TaskCard'
import { courseColorFor, type CourseColor } from '../lib/courseColors'
import { diffDays, formatLongDate } from '../lib/dates'
import { useCourses } from '../hooks/useCourses'
import { useLocalDone } from '../hooks/useLocalDone'
import { useTasks } from '../hooks/useTasks'
import type { TaskWithCourse } from '../types'

function PreviewTaskRow({ task, color }: { task: TaskWithCourse; color: CourseColor }) {
  const due = new Date(task.due_date)
  const weekday = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][due.getDay()]
  const time = `${String(due.getHours()).padStart(2, '0')}:${String(due.getMinutes()).padStart(2, '0')}`

  return (
    <Link
      to={`/tareas/${task.id}`}
      className="flex items-center gap-3.5 rounded-[22px] border-2 border-ink p-4 no-underline"
      style={{ background: color.tint }}
    >
      <span className="h-full min-h-[36px] w-1.5 self-stretch rounded-full" style={{ background: color.dot }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">
          {task.courses?.name ?? 'Curso'}
        </div>
        <div className="font-display mt-0.5 line-clamp-2 text-[19px] font-semibold leading-tight text-ink">
          {task.title}
        </div>
      </div>
      <div className="shrink-0 text-right text-[13px] font-bold text-ink">
        {weekday}
        <br />
        {time}
      </div>
    </Link>
  )
}

export function HomeView() {
  const { courses } = useCourses()
  const { tasks, loading } = useTasks({ archived: false })
  const { isDone, toggle } = useLocalDone()

  const pending = useMemo(() => tasks.filter((t) => !isDone(t.id)), [tasks, isDone])
  const today = useMemo(() => pending.filter((t) => diffDays(t.due_date) <= 0), [pending])
  const tomorrow = useMemo(() => pending.filter((t) => diffDays(t.due_date) === 1), [pending])
  const thisWeek = useMemo(() => pending.filter((t) => diffDays(t.due_date) >= 0 && diffDays(t.due_date) <= 7), [pending])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 pt-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-teal">{formatLongDate()}</div>
          <h1 className="font-display mt-2 text-[34px] font-extrabold leading-[1.02] tracking-tight text-ink">
            {today.length > 0
              ? `Tienes ${today.length} entrega${today.length > 1 ? 's' : ''} para hoy`
              : 'No tienes entregas para hoy'}
          </h1>
        </div>
        <Link to="/login" className="mt-1 shrink-0 text-xs font-bold text-muted no-underline">
          Delegados
        </Link>
      </header>

      {loading && <p className="text-sm text-muted">Cargando…</p>}

      {today.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange" />
            <span className="text-[13px] font-bold uppercase tracking-wide text-ink">Hoy</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {today.map((task) => (
              <FeaturedTaskCard key={task.id} task={task} color={courseColorFor(courses, task.course_id)} onToggleDone={toggle} />
            ))}
          </div>
        </section>
      )}

      {tomorrow.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-pink" />
            <span className="text-[13px] font-bold uppercase tracking-wide text-ink">Mañana</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {tomorrow.map((task) => (
              <PreviewTaskRow key={task.id} task={task} color={courseColorFor(courses, task.course_id)} />
            ))}
          </div>
        </section>
      )}

      {!loading && today.length === 0 && tomorrow.length === 0 && (
        <p className="rounded-[20px] bg-teal/10 p-5 text-center text-sm text-ink">
          Nada pendiente para hoy ni mañana. Buen momento para respirar.
        </p>
      )}

      <Link
        to="/tareas"
        className="flex items-center justify-between rounded-[20px] bg-teal/10 px-4.5 py-3.5 no-underline"
      >
        <span className="text-sm font-medium text-ink">
          Esta semana quedan <strong>{thisWeek.length} tarea{thisWeek.length !== 1 ? 's' : ''}</strong>
        </span>
        <span className="text-sm font-bold text-teal">Ver todas ›</span>
      </Link>
    </div>
  )
}
