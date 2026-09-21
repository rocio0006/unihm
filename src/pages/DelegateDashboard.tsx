import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { TaskForm, type TaskFormValues } from '../components/TaskForm'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { useTasks } from '../hooks/useTasks'
import { supabase } from '../lib/supabase'
import { deleteTaskAttachment, uploadTaskAttachment } from '../lib/attachments'
import { courseColorFor } from '../lib/courseColors'
import { formatDueDate } from '../lib/dates'
import type { TaskAttachment, TaskWithCourse } from '../types'

export function DelegateDashboard() {
  const { session, profile, courseIds, loading: authLoading } = useAuth()
  const { courses } = useCourses()
  const { tasks, loading, refresh } = useTasks({ archived: false })
  const [editing, setEditing] = useState<TaskWithCourse | 'new' | null>(null)
  const [editingAttachment, setEditingAttachment] = useState<TaskAttachment | null>(null)

  const myCourses = useMemo(
    () => (profile?.role === 'admin' ? courses : courses.filter((c) => courseIds.includes(c.id))),
    [courses, courseIds, profile],
  )

  const myTasks = useMemo(
    () => (profile?.role === 'admin' ? tasks : tasks.filter((t) => courseIds.includes(t.course_id))),
    [tasks, courseIds, profile],
  )

  if (!authLoading && !session) return <Navigate to="/login" replace />

  async function openEdit(task: TaskWithCourse) {
    setEditing(task)
    setEditingAttachment(null)
    const existing = task.task_attachments[0]
    if (existing) {
      const { data } = await supabase.from('task_attachments').select('*').eq('id', existing.id).single()
      setEditingAttachment((data as TaskAttachment) ?? null)
    }
  }

  function closeForm() {
    setEditing(null)
    setEditingAttachment(null)
  }

  async function applyAttachmentChanges(
    courseId: string,
    taskId: string,
    values: Pick<TaskFormValues, 'attachmentFile' | 'removeAttachment'>,
    current: TaskAttachment | null,
  ) {
    if (values.attachmentFile) {
      if (current) await deleteTaskAttachment(current)
      await uploadTaskAttachment(courseId, taskId, values.attachmentFile)
    } else if (values.removeAttachment && current) {
      await deleteTaskAttachment(current)
    }
  }

  async function handleCreate(values: TaskFormValues) {
    if (!session) return
    const { attachmentFile, removeAttachment, ...taskValues } = values
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...taskValues, created_by: session.user.id })
      .select()
      .single()
    if (error) throw error

    await applyAttachmentChanges(taskValues.course_id, data.id, { attachmentFile, removeAttachment }, null)
    closeForm()
    refresh()
  }

  async function handleUpdate(taskId: string, values: TaskFormValues) {
    const { attachmentFile, removeAttachment, ...taskValues } = values
    const { error } = await supabase
      .from('tasks')
      .update({ ...taskValues, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    if (error) throw error

    await applyAttachmentChanges(taskValues.course_id, taskId, { attachmentFile, removeAttachment }, editingAttachment)
    closeForm()
    refresh()
  }

  async function handleDelete(taskId: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) alert(error.message)
    else refresh()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink">
            {profile?.role === 'admin' ? 'Panel de administrador' : 'Mis tareas'}
          </h1>
          <p className="truncate text-sm text-muted">{profile?.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-sm font-bold">
          {profile?.role === 'admin' && (
            <Link to="/admin" className="text-teal no-underline">
              Administración
            </Link>
          )}
          <button onClick={() => supabase.auth.signOut()} className="text-muted">
            Salir
          </button>
        </div>
      </header>

      {myCourses.length === 0 && profile?.role === 'delegado' && (
        <p className="mb-4 rounded-[18px] bg-yellow/60 p-4 text-sm text-ink">
          Aún no tienes cursos asignados. Pide al administrador que te asigne uno.
        </p>
      )}

      {editing === 'new' ? (
        <div className="rounded-[26px] border-2 border-ink bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[22px] font-extrabold text-ink">Nueva tarea</h2>
            <button
              onClick={closeForm}
              aria-label="Cerrar"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink text-ink"
            >
              ✕
            </button>
          </div>
          <TaskForm courses={myCourses} onSubmit={handleCreate} onCancel={closeForm} />
        </div>
      ) : editing ? (
        <div className="rounded-[26px] border-2 border-ink bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-[22px] font-extrabold text-ink">Editar tarea</h2>
            <button
              onClick={closeForm}
              aria-label="Cerrar"
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink text-ink"
            >
              ✕
            </button>
          </div>
          <TaskForm
            courses={myCourses}
            initial={editing}
            initialAttachment={editingAttachment}
            onSubmit={(values) => handleUpdate(editing.id, values)}
            onCancel={closeForm}
          />
        </div>
      ) : (
        myCourses.length > 0 && (
          <button
            onClick={() => setEditing('new')}
            className="font-display mb-5 w-full rounded-full bg-orange py-4 text-[16px] font-extrabold text-ink"
          >
            ＋ Nueva tarea
          </button>
        )
      )}

      {!editing && (
        <div className="flex flex-col gap-2.5">
          {loading && <p className="text-sm text-muted">Cargando…</p>}
          {!loading && myTasks.length === 0 && <p className="text-sm text-muted">No hay tareas todavía.</p>}

          {myTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 rounded-[20px] border-2 border-ink p-4"
              style={{ background: courseColorFor(courses, task.course_id).tint }}
            >
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">
                  {task.courses?.name}
                </div>
                <p className="font-display truncate text-[17px] font-semibold text-ink">{task.title}</p>
                <p className="text-[13px] text-muted">{formatDueDate(task.due_date)}</p>
              </div>
              <div className="flex shrink-0 gap-2 text-[13px] font-bold">
                <button onClick={() => openEdit(task)} className="text-teal">
                  Editar
                </button>
                <button onClick={() => handleDelete(task.id)} className="text-orange">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
