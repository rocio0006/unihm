const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export type Urgency = 'overdue' | 'today' | 'tomorrow' | 'soon' | 'later'

export function diffDays(dueDateIso: string, now = new Date()): number {
  const due = startOfDay(new Date(dueDateIso))
  const today = startOfDay(now)
  return Math.round((due.getTime() - today.getTime()) / DAY_MS)
}

export function urgencyOf(dueDateIso: string, now = new Date()): Urgency {
  const d = diffDays(dueDateIso, now)
  if (d < 0) return 'overdue'
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  if (d <= 7) return 'soon'
  return 'later'
}

function timeLabel(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** "Hoy 23:59", "Mañana 20:00", "Mar 8 · 20:00" */
export function formatDueDate(dueDateIso: string, now = new Date()): string {
  const due = new Date(dueDateIso)
  const urgency = urgencyOf(dueDateIso, now)
  const time = timeLabel(due)

  if (urgency === 'today') return `Hoy ${time}`
  if (urgency === 'tomorrow') return `Mañana ${time}`
  if (urgency === 'overdue') return `Venció ${WEEKDAYS[due.getDay()]} ${due.getDate()} · ${time}`
  return `${WEEKDAYS[due.getDay()]} ${due.getDate()} · ${time}`
}

/** Compact two-line label used in dense rows: "Mar" / "20:00" */
export function formatDueCompact(dueDateIso: string): { day: string; time: string } {
  const due = new Date(dueDateIso)
  const urgency = urgencyOf(dueDateIso)
  return {
    day: urgency === 'today' ? 'Hoy' : urgency === 'tomorrow' ? 'Mañana' : WEEKDAYS[due.getDay()],
    time: timeLabel(due),
  }
}

/** "Lunes 7 de septiembre" — used for the Inicio header */
export function formatLongDate(d = new Date()): string {
  const longWeekdays = [
    'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
  ]
  return `${longWeekdays[d.getDay()][0].toUpperCase()}${longWeekdays[d.getDay()].slice(1)} ${d.getDate()} de ${
    ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][d.getMonth()]
  }`
}

/** "lun 7 sep" — used for compact date chips */
export function formatShortDate(dueDateIso: string): string {
  const d = new Date(dueDateIso)
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}
