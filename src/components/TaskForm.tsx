import { useRef, useState } from 'react'
import { courseLabel } from '../lib/courseColors'
import { isSafeHttpUrl } from '../lib/url'
import type { Course, Task, TaskAttachment } from '../types'

export interface TaskFormValues {
  course_id: string
  title: string
  description: string
  due_date: string
  links: string[]
  /** A new file was picked — upload it (replacing any existing attachment). */
  attachmentFile: File | null
  /** User removed the existing attachment without picking a replacement. */
  removeAttachment: boolean
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/heic,application/pdf'

interface TaskFormProps {
  courses: Course[]
  initial?: Task
  initialAttachment?: Pick<TaskAttachment, 'id' | 'file_url' | 'file_type'> | null
  onSubmit: (values: TaskFormValues) => Promise<void>
  onCancel?: () => void
}

function toDateInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeInput(iso?: string): string {
  if (!iso) return '23:59'
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function dateInputFor(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function nextMondayInput(): string {
  const d = new Date()
  const add = ((1 - d.getDay() + 7) % 7) || 7
  d.setDate(d.getDate() + add)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function TaskForm({ courses, initial, initialAttachment, onSubmit, onCancel }: TaskFormProps) {
  const [courseId, setCourseId] = useState(initial?.course_id ?? courses[0]?.id ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [date, setDate] = useState(toDateInput(initial?.due_date))
  const [time, setTime] = useState(toTimeInput(initial?.due_date))
  const [links, setLinks] = useState<string[]>(initial?.links ?? [])
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [removeAttachment, setRemoveAttachment] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  function openDatePicker() {
    // showPicker() lets a click anywhere on the styled box open the native
    // calendar, not just the small icon the browser renders inside the
    // input — falls back to nothing on browsers without it (Safari <17),
    // where clicking the input itself still opens it natively.
    dateInputRef.current?.showPicker?.()
  }

  const hasExistingAttachment = !!initialAttachment && !removeAttachment

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (file && file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('El archivo supera los 10MB.')
      setAttachmentFile(null)
      return
    }
    setAttachmentError(null)
    setAttachmentFile(file)
    setRemoveAttachment(false)
  }

  function clearAttachment() {
    setAttachmentFile(null)
    setAttachmentError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (initialAttachment) setRemoveAttachment(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!courseId || !title || !date) {
      setError('Curso, título y fecha límite son obligatorios.')
      return
    }
    const cleanedLinks = links.map((l) => l.trim()).filter(Boolean)
    const badLink = cleanedLinks.find((l) => !isSafeHttpUrl(l))
    if (badLink) {
      setError(`"${badLink}" no es un enlace http(s) válido.`)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await onSubmit({
        course_id: courseId,
        title,
        description,
        due_date: new Date(`${date}T${time || '23:59'}`).toISOString(),
        links: cleanedLinks,
        attachmentFile,
        removeAttachment,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }

  const fieldLabel = 'mb-2 text-[12px] font-bold uppercase tracking-wide text-muted'
  const fieldBox = 'w-full rounded-[18px] border-2 border-ink bg-white px-4 py-3.5 text-[15px] text-ink outline-none'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <div className={fieldLabel}>Curso</div>
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCourseId(c.id)}
              className={`rounded-full border-2 px-3.5 py-2 text-[13px] font-bold ${
                courseId === c.id ? 'border-ink bg-orange text-ink' : 'border-ink/25 bg-white text-ink'
              }`}
            >
              {courseLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={fieldLabel}>Título</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={`${fieldBox} font-display font-semibold`} />
      </div>

      <div>
        <div className={fieldLabel}>
          Descripción <span className="font-medium normal-case tracking-normal text-muted-2">opcional</span>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={fieldBox}
        />
      </div>

      <div>
        <div className={fieldLabel}>Fecha límite</div>
        <div className="flex gap-2">
          <div
            onClick={openDatePicker}
            className="flex-1 cursor-pointer rounded-[18px] bg-teal px-4 py-3.5"
          >
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full cursor-pointer bg-transparent text-[15px] font-bold text-cream outline-none [color-scheme:dark]"
            />
          </div>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-[118px] rounded-[18px] border-2 border-ink bg-white px-4 py-3.5 text-[15px] font-bold text-ink outline-none"
          />
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <button type="button" onClick={() => setDate(dateInputFor(0))} className="rounded-full bg-teal/10 px-3 py-1.5 text-[12px] font-bold text-teal-dark">
            Hoy
          </button>
          <button type="button" onClick={() => setDate(dateInputFor(1))} className="rounded-full bg-teal/10 px-3 py-1.5 text-[12px] font-bold text-teal-dark">
            Mañana
          </button>
          <button type="button" onClick={() => setDate(nextMondayInput())} className="rounded-full bg-teal/10 px-3 py-1.5 text-[12px] font-bold text-teal-dark">
            Próx. lunes
          </button>
        </div>
      </div>

      <div>
        <div className={fieldLabel}>Enlaces</div>
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={link}
                onChange={(e) => setLinks(links.map((l, li) => (li === i ? e.target.value : l)))}
                placeholder="https://…"
                className={`${fieldBox} flex-1`}
              />
              <button
                type="button"
                onClick={() => setLinks(links.filter((_, li) => li !== i))}
                aria-label="Quitar enlace"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink text-ink"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setLinks([...links, ''])}
            className="flex-1 rounded-[18px] border-2 border-dashed border-ink py-3.5 text-center text-[13px] font-bold text-ink"
          >
            ＋ Enlace
          </button>
          {!attachmentFile && !hasExistingAttachment && (
            <label className="flex-1 cursor-pointer rounded-[18px] border-2 border-dashed border-ink py-3.5 text-center text-[13px] font-bold text-ink">
              ＋ Foto o PDF
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {attachmentError && <p className="mt-2 text-sm text-red-600">{attachmentError}</p>}

        {(attachmentFile || hasExistingAttachment) && (
          <div className="mt-2 flex items-center gap-2 rounded-[18px] border-2 border-ink bg-white px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal text-xs font-bold text-cream">
              {attachmentFile ? (attachmentFile.type === 'application/pdf' ? 'PDF' : 'IMG') : initialAttachment?.file_type === 'pdf' ? 'PDF' : 'IMG'}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink">
              {attachmentFile ? attachmentFile.name : 'Archivo adjunto actual'}
            </span>
            <button
              type="button"
              onClick={clearAttachment}
              aria-label="Quitar adjunto"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-ink text-ink"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="font-display flex-1 rounded-full bg-orange py-4 text-center text-[17px] font-extrabold text-ink disabled:opacity-50"
        >
          {saving ? 'Guardando…' : initial ? 'Guardar cambios' : 'Publicar tarea'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar"
            className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border-2 border-ink text-lg text-ink"
          >
            ⌫
          </button>
        )}
      </div>
    </form>
  )
}
