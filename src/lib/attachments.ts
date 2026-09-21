import { supabase } from './supabase'
import type { AttachmentFileType, TaskAttachment } from '../types'

const BUCKET = 'task-attachments'
const MAX_BYTES = 10 * 1024 * 1024

export function attachmentFileType(file: File): AttachmentFileType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'other'
}

async function prepareFile(file: File): Promise<File> {
  if (file.size > MAX_BYTES) {
    throw new Error('El archivo supera los 10MB.')
  }
  if (file.type.startsWith('image/')) {
    // Loaded on demand — only delegates uploading a photo need this, not
    // the much larger audience of students who only ever read tasks.
    const { default: imageCompression } = await import('browser-image-compression')
    return imageCompression(file, { maxSizeMB: 2, maxWidthOrHeight: 1920, useWebWorker: true })
  }
  return file
}

export async function uploadTaskAttachment(courseId: string, taskId: string, file: File): Promise<TaskAttachment> {
  const prepared = await prepareFile(file)
  const ext = file.name.split('.').pop() || 'bin'
  const path = `${courseId}/${taskId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, prepared, { upsert: false })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { data, error } = await supabase
    .from('task_attachments')
    .insert({ task_id: taskId, file_url: urlData.publicUrl, file_type: attachmentFileType(file) })
    .select()
    .single()
  if (error) throw error
  return data as TaskAttachment
}

export async function deleteTaskAttachment(attachment: Pick<TaskAttachment, 'id' | 'file_url'>): Promise<void> {
  const marker = `/object/public/${BUCKET}/`
  const idx = attachment.file_url.indexOf(marker)
  if (idx !== -1) {
    const path = decodeURIComponent(attachment.file_url.slice(idx + marker.length))
    await supabase.storage.from(BUCKET).remove([path])
  }
  const { error } = await supabase.from('task_attachments').delete().eq('id', attachment.id)
  if (error) throw error
}
