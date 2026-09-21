import { Link } from 'react-router-dom'
import { formatDueDate } from '../lib/dates'
import type { CourseColor } from '../lib/courseColors'
import type { TaskWithCourse } from '../types'

interface TaskMetaProps {
  task: TaskWithCourse
}

function taskMeta({ task }: TaskMetaProps): string | null {
  const parts: string[] = []
  if (task.links.length > 0) parts.push(`${task.links.length} enlace${task.links.length > 1 ? 's' : ''}`)
  const attachment = task.task_attachments[0]
  if (attachment) parts.push(attachment.file_type === 'pdf' ? '1 PDF' : '1 foto')
  return parts.length > 0 ? parts.join(' · ') : null
}

interface ListTaskCardProps {
  task: TaskWithCourse
  color: CourseColor
  done: boolean
  onToggleDone: (taskId: string) => void
}

export function ListTaskCard({ task, color, done, onToggleDone }: ListTaskCardProps) {
  const meta = taskMeta({ task })

  return (
    <div
      className={`flex items-start gap-3 rounded-[22px] border-2 p-4 transition ${
        done ? 'border-transparent bg-ink/5 opacity-65' : 'border-ink'
      }`}
      style={done ? undefined : { background: color.tint }}
    >
      <button
        type="button"
        onClick={() => onToggleDone(task.id)}
        aria-label={done ? `Marcar "${task.title}" como pendiente` : `Marcar "${task.title}" como hecha`}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-sm font-bold ${
          done ? 'bg-teal text-cream' : 'bg-transparent text-transparent'
        }`}
      >
        ✓
      </button>

      <Link to={`/tareas/${task.id}`} className="min-w-0 flex-1 no-underline">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color.dot }} />
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">
            {task.courses?.name ?? 'Curso'}
          </span>
        </div>
        <div className={`font-display line-clamp-2 text-[19px] font-semibold leading-tight text-ink ${done ? 'line-through' : ''}`}>
          {task.title}
        </div>
        <div className="mt-1 text-[13px] text-muted">
          {formatDueDate(task.due_date)}
          {meta && ` · ${meta}`}
        </div>
      </Link>
    </div>
  )
}

interface FeaturedTaskCardProps {
  task: TaskWithCourse
  color: CourseColor
  onToggleDone: (taskId: string) => void
}

export function FeaturedTaskCard({ task, color, onToggleDone }: FeaturedTaskCardProps) {
  const meta = taskMeta({ task })

  return (
    <div
      className="relative overflow-hidden rounded-[26px] p-5"
      style={{ background: color.bg, color: color.fg }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/25" />
      <div className="relative">
        <span
          className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: '#1E2B2B', color: '#FFF7EF' }}
        >
          {task.courses?.name ?? 'Curso'}
        </span>
        <Link to={`/tareas/${task.id}`} className="block no-underline" style={{ color: color.fg }}>
          <div className="font-display mb-2 mt-3 text-[25px] font-extrabold leading-tight tracking-tight">
            {task.title}
          </div>
        </Link>
        <div className="flex items-center gap-3.5 text-sm font-bold">
          <span>{formatDueDate(task.due_date).replace(/^(Hoy|Mañana) /, '')}</span>
          {meta && <span className="font-medium opacity-75">{meta}</span>}
        </div>
        <div className="relative mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onToggleDone(task.id)}
            className="flex-1 rounded-full bg-cream py-2.5 text-center text-sm font-bold text-ink"
          >
            Marcar hecho
          </button>
          <Link
            to={`/tareas/${task.id}`}
            className="grid w-11 place-items-center rounded-full bg-ink/15 text-lg no-underline"
            style={{ color: color.fg }}
          >
            ›
          </Link>
        </div>
      </div>
    </div>
  )
}
