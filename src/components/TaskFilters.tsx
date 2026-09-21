import { courseLabel } from '../lib/courseColors'
import type { Course } from '../types'

export type StatusFilter = 'pending' | 'all'

interface TaskFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  courses: Course[]
  courseId: string | null
  onCourseChange: (courseId: string | null) => void
  status: StatusFilter
  onStatusChange: (status: StatusFilter) => void
}

export function TaskFilters({
  search,
  onSearchChange,
  courses,
  courseId,
  onCourseChange,
  status,
  onStatusChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2.5 rounded-full border-2 border-ink bg-white px-4.5 py-3 text-[15px] text-muted-2">
        <span className="text-ink">⌕</span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar tarea o curso"
          className="w-full bg-transparent text-ink outline-none placeholder:text-muted-2"
        />
      </label>

      <div className="flex overflow-hidden rounded-full border-2 border-ink">
        <button
          type="button"
          onClick={() => onStatusChange('pending')}
          className={`flex-1 py-2 text-[13px] font-bold ${status === 'pending' ? 'bg-ink text-cream' : 'bg-white text-ink'}`}
        >
          Pendientes
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('all')}
          className={`flex-1 py-2 text-[13px] font-bold ${status === 'all' ? 'bg-ink text-cream' : 'bg-white text-ink'}`}
        >
          Todas (incluye hechas)
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onCourseChange(null)}
          className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold ${
            courseId === null ? 'bg-ink text-cream' : 'border-2 border-ink bg-white text-ink'
          }`}
        >
          Todos los cursos
        </button>
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCourseChange(c.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold ${
              courseId === c.id ? 'bg-ink text-cream' : 'border-2 border-ink bg-white text-ink'
            }`}
          >
            {courseLabel(c)}
          </button>
        ))}
      </div>
    </div>
  )
}
