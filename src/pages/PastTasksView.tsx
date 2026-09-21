import { ListTaskCard } from '../components/TaskCard'
import { useCourses } from '../hooks/useCourses'
import { useLocalDone } from '../hooks/useLocalDone'
import { useTasks } from '../hooks/useTasks'
import { courseColorFor } from '../lib/courseColors'

export function PastTasksView() {
  const { courses } = useCourses()
  const { tasks, loading, error } = useTasks({ archived: true })
  const { isDone, toggle } = useLocalDone()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 pt-5">
      <header>
        <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink">Pasadas</h1>
        <p className="mt-2 text-[15px] text-muted">
          Tareas vencidas hace más de 30 días. Se guardan aquí, no se borran.
        </p>
      </header>

      {loading && <p className="text-sm text-muted">Cargando…</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}
      {!loading && !error && tasks.length === 0 && (
        <p className="mt-6 text-center text-sm text-muted">No hay tareas archivadas todavía.</p>
      )}

      <div className="flex flex-col gap-2.5">
        {tasks.map((task) => (
          <ListTaskCard
            key={task.id}
            task={task}
            color={courseColorFor(courses, task.course_id)}
            done={isDone(task.id)}
            onToggleDone={toggle}
          />
        ))}
      </div>
    </div>
  )
}
