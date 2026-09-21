import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useCourses } from '../hooks/useCourses'
import { supabase } from '../lib/supabase'
import { courseColorByIndex, courseLabel } from '../lib/courseColors'
import type { AppUser, DelegateAssignment } from '../types'

function useAllUsers() {
  const [users, setUsers] = useState<AppUser[]>([])

  const refresh = async () => {
    const { data } = await supabase.from('users').select('*').order('email')
    setUsers((data as AppUser[]) ?? [])
  }

  useEffect(() => {
    refresh()
  }, [])

  return { users, refresh }
}

function useAllAssignments() {
  const [assignments, setAssignments] = useState<DelegateAssignment[]>([])

  const refresh = async () => {
    const { data } = await supabase.from('delegate_assignments').select('*')
    setAssignments((data as DelegateAssignment[]) ?? [])
  }

  useEffect(() => {
    refresh()
  }, [])

  return { assignments, refresh }
}

function initialsOf(email: string): string {
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/).filter(Boolean)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

export function AdminPage() {
  const { session, profile, loading: authLoading } = useAuth()
  const { courses, refresh: refreshCourses } = useCourses()
  const { users, refresh: refreshUsers } = useAllUsers()
  const { assignments, refresh: refreshAssignments } = useAllAssignments()
  const [tab, setTab] = useState<'delegates' | 'courses'>('delegates')
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseShortName, setNewCourseShortName] = useState('')
  const [showInviteInfo, setShowInviteInfo] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null)
  const [editingCourseName, setEditingCourseName] = useState('')
  const [editingCourseShortName, setEditingCourseShortName] = useState('')

  if (!authLoading && (!session || profile?.role !== 'admin')) return <Navigate to="/panel" replace />

  async function addCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!newCourseName.trim()) return
    const { error } = await supabase
      .from('courses')
      .insert({ name: newCourseName.trim(), short_name: newCourseShortName.trim() || null })
    if (error) alert(error.message)
    else {
      setNewCourseName('')
      setNewCourseShortName('')
      refreshCourses()
    }
  }

  async function deleteCourse(courseId: string) {
    if (!confirm('Esto también eliminará sus tareas y asignaciones. ¿Continuar?')) return
    const { error } = await supabase.from('courses').delete().eq('id', courseId)
    if (error) alert(error.message)
    else refreshCourses()
  }

  function startEditCourse(course: { id: string; name: string; short_name: string | null }) {
    setEditingCourseId(course.id)
    setEditingCourseName(course.name)
    setEditingCourseShortName(course.short_name ?? '')
  }

  async function saveEditCourse() {
    if (!editingCourseId || !editingCourseName.trim()) return
    const { error } = await supabase
      .from('courses')
      .update({ name: editingCourseName.trim(), short_name: editingCourseShortName.trim() || null })
      .eq('id', editingCourseId)
    if (error) alert(error.message)
    else {
      setEditingCourseId(null)
      refreshCourses()
    }
  }

  async function addAssignment(userId: string, courseId: string) {
    const { error } = await supabase.from('delegate_assignments').insert({ user_id: userId, course_id: courseId })
    if (error) alert(error.message)
    else refreshAssignments()
  }

  async function removeAssignment(assignmentId: string) {
    const { error } = await supabase.from('delegate_assignments').delete().eq('id', assignmentId)
    if (error) alert(error.message)
    else refreshAssignments()
  }

  async function toggleRole(user: AppUser) {
    const nextRole = user.role === 'admin' ? 'delegado' : 'admin'
    if (!confirm(`¿Cambiar el rol de ${user.email} a "${nextRole}"?`)) return
    const { error } = await supabase.from('users').update({ role: nextRole }).eq('id', user.id)
    if (error) alert(error.message)
    else refreshUsers()
  }

  const delegatesAndAdmins = users.filter((u) => u.role === 'delegado' || u.role === 'admin')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-teal">Admin</div>
          <h1 className="font-display mt-1 text-[28px] font-extrabold tracking-tight text-ink">Cursos y delegados</h1>
        </div>
        <Link to="/panel" className="text-sm font-bold text-muted no-underline">
          Volver
        </Link>
      </header>

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab('delegates')}
          className={`rounded-full px-3.5 py-2 text-[13px] font-bold ${
            tab === 'delegates' ? 'bg-ink text-cream' : 'border-2 border-ink/25 bg-white text-ink'
          }`}
        >
          Delegados
        </button>
        <button
          onClick={() => setTab('courses')}
          className={`rounded-full px-3.5 py-2 text-[13px] font-bold ${
            tab === 'courses' ? 'bg-ink text-cream' : 'border-2 border-ink/25 bg-white text-ink'
          }`}
        >
          Cursos · {courses.length}
        </button>
      </div>

      {tab === 'courses' ? (
        <section>
          <form onSubmit={addCourse} className="mb-3 flex flex-wrap gap-2">
            <input
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="Nombre completo del curso"
              className="min-w-[180px] flex-1 rounded-[18px] border-2 border-ink bg-white px-4 py-3 text-sm text-ink outline-none"
            />
            <input
              value={newCourseShortName}
              onChange={(e) => setNewCourseShortName(e.target.value)}
              placeholder="Abreviación (opcional)"
              className="w-[150px] rounded-[18px] border-2 border-ink bg-white px-4 py-3 text-sm text-ink outline-none"
            />
            <button type="submit" className="rounded-full bg-orange px-4 py-3 text-sm font-bold text-ink">
              Agregar
            </button>
          </form>
          <ul className="flex flex-col gap-2">
            {courses.map((c, i) =>
              editingCourseId === c.id ? (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-2 rounded-[20px] border-2 border-ink bg-white p-3.5"
                >
                  <input
                    value={editingCourseName}
                    onChange={(e) => setEditingCourseName(e.target.value)}
                    autoFocus
                    placeholder="Nombre completo"
                    className="min-w-[140px] flex-1 rounded-full border-2 border-ink/25 px-3 py-1.5 text-sm text-ink outline-none"
                  />
                  <input
                    value={editingCourseShortName}
                    onChange={(e) => setEditingCourseShortName(e.target.value)}
                    placeholder="Abreviación"
                    className="w-[120px] rounded-full border-2 border-ink/25 px-3 py-1.5 text-sm text-ink outline-none"
                  />
                  <button onClick={saveEditCourse} className="text-sm font-bold text-teal">
                    Guardar
                  </button>
                  <button onClick={() => setEditingCourseId(null)} className="text-sm font-bold text-muted">
                    Cancelar
                  </button>
                </li>
              ) : (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-[20px] border-2 border-ink bg-white p-3.5"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: courseColorByIndex(i).dot }} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{c.name}</span>
                      {c.short_name && <span className="block text-xs text-muted">{c.short_name}</span>}
                    </span>
                  </span>
                  <div className="flex shrink-0 gap-3 text-sm font-bold">
                    <button onClick={() => startEditCourse(c)} className="text-teal">
                      Editar
                    </button>
                    <button onClick={() => deleteCourse(c.id)} className="text-orange">
                      Eliminar
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      ) : (
        <section className="flex flex-col gap-2.5">
          {delegatesAndAdmins.map((user, i) => {
            const userAssignments = assignments.filter((a) => a.user_id === user.id)
            const unassigned = courses.filter((c) => !userAssignments.some((a) => a.course_id === c.id))
            const color = courseColorByIndex(i)

            return (
              <div key={user.id} className="rounded-[24px] border-2 border-ink bg-white p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="font-display grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full text-[16px] font-extrabold"
                    style={{ background: color.bg, color: color.fg }}
                  >
                    {initialsOf(user.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-[18px] font-semibold text-ink">{user.email.split('@')[0]}</p>
                    <p className="truncate text-[13px] text-muted">{user.email}</p>
                  </div>
                  <button
                    onClick={() => toggleRole(user)}
                    title="Cambiar rol"
                    className="rounded-full border-2 border-ink/25 px-2.5 py-1 text-[11px] font-bold text-ink"
                  >
                    {user.role === 'admin' ? 'Admin' : 'Delegado'}
                  </button>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  {userAssignments.map((a) => {
                    const course = courses.find((c) => c.id === a.course_id)
                    if (!course) return null
                    return (
                      <button
                        key={a.id}
                        onClick={() => removeAssignment(a.id)}
                        className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                        style={{ background: courseColorByIndex(courses.indexOf(course)).bg, color: courseColorByIndex(courses.indexOf(course)).fg }}
                      >
                        {courseLabel(course)} ✕
                      </button>
                    )
                  })}

                  {unassigned.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => e.target.value && addAssignment(user.id, e.target.value)}
                      className="rounded-full border-2 border-dashed border-ink/35 bg-transparent px-2.5 py-1.5 text-[12px] font-bold text-ink"
                    >
                      <option value="">＋ curso</option>
                      {unassigned.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )
          })}

          {delegatesAndAdmins.length === 0 && (
            <p className="text-sm text-muted">Todavía no hay delegados registrados.</p>
          )}

          <div className="rounded-[22px] bg-orange/15 p-4 text-[13px] leading-relaxed text-[#7A4520]">
            Un delegado solo puede tocar las tareas de los cursos que tiene aquí. Quitar el curso le quita el permiso
            al instante.
          </div>

          <button
            onClick={() => setShowInviteInfo((v) => !v)}
            className="font-display mt-1 rounded-full bg-ink py-4 text-center text-[17px] font-extrabold text-cream"
          >
            ＋ Invitar delegado
          </button>
          {showInviteInfo && (
            <p className="rounded-[18px] bg-teal/10 p-4 text-[13px] leading-relaxed text-ink">
              No hay invitación por correo todavía: pídele que entre a <strong>/login</strong> y cree su cuenta con
              correo y contraseña (confirma el correo que le llega). Después de su primer ingreso aparecerá aquí
              para que le asignes sus cursos.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
