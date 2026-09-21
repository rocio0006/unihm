-- Archivado automático: tareas cuya fecha límite pasó hace más de
-- 30 días se marcan archived = true. No se borran.

create function public.archive_old_tasks()
returns void
language sql
security definer
set search_path = public
as $$
  update public.tasks
  set archived = true, archived_at = now()
  where archived = false
    and due_date < now() - interval '30 days';
$$;

-- Requiere la extensión pg_cron (disponible en Supabase: Database ->
-- Extensions -> pg_cron). Se ejecuta una vez al día a las 3am UTC.
-- Si pg_cron no está disponible en tu proyecto, corre esta función
-- manualmente o desde un Edge Function con su propio scheduler.
create extension if not exists pg_cron with schema extensions;

select
  cron.schedule(
    'archive-old-tasks-daily',
    '0 3 * * *',
    $$ select public.archive_old_tasks(); $$
  )
where not exists (
  select 1 from cron.job where jobname = 'archive-old-tasks-daily'
);
