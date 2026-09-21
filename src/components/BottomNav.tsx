import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Inicio', icon: '◉', end: true },
  { to: '/tareas', label: 'Tareas', icon: '▤', end: false },
  { to: '/avisos', label: 'Avisos', icon: '◔', end: false },
  { to: '/pasadas', label: 'Pasadas', icon: '◫', end: false },
]

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-10 border-t-2 border-ink bg-cream px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1 text-center">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-xl py-1 ${isActive ? 'opacity-100' : 'opacity-45'}`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[11px] font-bold text-ink">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
