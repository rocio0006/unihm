-- Fase 2: Storage bucket para adjuntos de tareas (1 archivo por tarea,
-- imagen o PDF, máx. 10MB — la compresión de imágenes ocurre en el
-- navegador antes de subir, ver src/lib/attachments.ts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-attachments',
  'task-attachments',
  true,
  10485760, -- 10MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

-- Rutas dentro del bucket con forma "{course_id}/{task_id}/{archivo}" —
-- así la política puede reutilizar is_delegate_for_course() igual que
-- para la tabla task_attachments.

create policy "task-attachments select public" on storage.objects
  for select using (bucket_id = 'task-attachments');

create policy "task-attachments insert delegate or admin" on storage.objects
  for insert with check (
    bucket_id = 'task-attachments'
    and (
      public.is_admin()
      or public.is_delegate_for_course(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "task-attachments delete delegate or admin" on storage.objects
  for delete using (
    bucket_id = 'task-attachments'
    and (
      public.is_admin()
      or public.is_delegate_for_course(((storage.foldername(name))[1])::uuid)
    )
  );
