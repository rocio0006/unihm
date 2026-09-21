import { useCourses } from '../hooks/useCourses'
import { useNotificationFollows } from '../hooks/useNotificationFollows'
import { courseColorByIndex } from '../lib/courseColors'

function Toggle({ on, disabled, onClick }: { on: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-[30px] w-[52px] shrink-0 items-center rounded-full p-[3px] transition ${
        on ? 'justify-end bg-teal' : 'justify-start bg-ink/20'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <span className="h-6 w-6 rounded-full bg-cream" />
    </button>
  )
}

export function AvisosView() {
  const { courses } = useCourses()
  const { permission, requestPermission, followedCourseIds, toggle, error } = useNotificationFollows()
  const granted = permission === 'granted'
  const supported = typeof Notification !== 'undefined'

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-6 pt-5">
      <header>
        <h1 className="font-display text-[32px] font-extrabold tracking-tight text-ink">Avisos</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Un aviso el día antes de cada entrega, a las 19:00. No pedimos correo.
        </p>
      </header>

      <div className="flex items-center gap-4 rounded-[26px] bg-yellow p-5">
        <div className="flex-1">
          <div className="font-display text-[20px] font-extrabold text-ink">
            {!supported ? 'No disponible en este navegador' : granted ? 'Notificaciones activas' : 'Activar notificaciones'}
          </div>
          <div className="mt-0.5 text-[13px] text-[#6B5C1E]">
            {permission === 'denied'
              ? 'Bloqueadas — habilítalas desde los ajustes del navegador.'
              : 'Este dispositivo'}
          </div>
        </div>
        <Toggle on={granted} disabled={!supported || permission === 'denied'} onClick={requestPermission} />
      </div>

      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      <div className="mt-1.5 text-xs font-bold uppercase tracking-wide text-muted">Cursos que sigo</div>

      <div className="flex flex-col gap-2.5">
        {courses.map((c, i) => {
          const color = courseColorByIndex(i)
          const following = followedCourseIds.has(c.id)
          return (
            <div key={c.id} className="flex items-center gap-3.5 rounded-[22px] border-2 border-ink bg-white px-4.5 py-4">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color.dot }} />
              <span className="font-display flex-1 text-[17px] font-semibold text-ink">{c.name}</span>
              <Toggle on={following} disabled={!granted} onClick={() => toggle(c.id)} />
            </div>
          )
        })}
        {courses.length === 0 && <p className="text-sm text-muted">Todavía no hay cursos creados.</p>}
      </div>

      <div className="mt-auto rounded-[26px] bg-ink p-5 text-cream">
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-yellow">Así se ve el aviso</div>
        <div className="rounded-2xl bg-cream p-3.5 text-ink">
          <div className="text-[13px] font-bold">Tareas · Investigación Educativa</div>
          <div className="mt-0.5 text-[14px]">Mañana vence «Marco teórico, versión final» · 23:59</div>
        </div>
      </div>
    </div>
  )
}
