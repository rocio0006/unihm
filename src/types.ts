export type Role = 'admin' | 'delegado'

export interface AppUser {
  id: string
  email: string
  role: Role
  created_at: string
}

export interface Course {
  id: string
  name: string
  short_name: string | null
  created_at: string
}

export interface DelegateAssignment {
  id: string
  user_id: string
  course_id: string
  created_at: string
}

export interface Task {
  id: string
  course_id: string
  title: string
  description: string | null
  due_date: string
  links: string[]
  created_by: string
  created_at: string
  updated_at: string
  archived: boolean
  archived_at: string | null
}

export type AttachmentFileType = 'image' | 'pdf' | 'other'

export interface TaskAttachment {
  id: string
  task_id: string
  file_url: string
  file_type: AttachmentFileType
  uploaded_at: string
}

export interface TaskWithCourse extends Task {
  courses: Pick<Course, 'id' | 'name' | 'short_name'> | null
  task_attachments: Pick<TaskAttachment, 'id' | 'file_type'>[]
}
