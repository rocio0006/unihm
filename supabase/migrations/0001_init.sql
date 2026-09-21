-- UniHM: App de tareas universitarias por curso
-- Esquema inicial + Row Level Security

-- ============================================================
-- Tablas
-- ============================================================

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'delegado' check (role in ('admin', 'delegado')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.delegate_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz not null,
  links text[] not null default '{}',
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived boolean not null default false,
  archived_at timestamptz
);

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'pdf', 'other')),
  uploaded_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscription_data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.push_subscription_courses (
  subscription_id uuid not null references public.push_subscriptions (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  primary key (subscription_id, course_id)
);

create index tasks_course_id_idx on public.tasks (course_id);
create index tasks_due_date_idx on public.tasks (due_date);
create index tasks_archived_idx on public.tasks (archived);
create index delegate_assignments_user_id_idx on public.delegate_assignments (user_id);
create index delegate_assignments_course_id_idx on public.delegate_assignments (course_id);

-- ============================================================
-- Auto-crear fila en public.users al registrarse (magic link)
-- Rol por defecto: 'delegado'. Solo un admin puede promover a 'admin'
-- editando la fila directamente (ver README, bootstrap del primer admin).
-- ============================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Funciones helper para RLS (security definer para evitar
-- recursión de políticas sobre la propia tabla users)
-- ============================================================

create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_delegate_for_course(target_course_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.delegate_assignments
    where user_id = auth.uid() and course_id = target_course_id
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.delegate_assignments enable row level security;
alter table public.tasks enable row level security;
alter table public.task_attachments enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_subscription_courses enable row level security;

-- users: cada quien lee su propia fila; admin lee/edita todas
create policy "users select self or admin" on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy "users update admin only" on public.users
  for update using (public.is_admin());

create policy "users delete admin only" on public.users
  for delete using (public.is_admin());

-- courses: lectura pública (incluye anon), escritura solo admin
create policy "courses select public" on public.courses
  for select using (true);

create policy "courses insert admin only" on public.courses
  for insert with check (public.is_admin());

create policy "courses update admin only" on public.courses
  for update using (public.is_admin());

create policy "courses delete admin only" on public.courses
  for delete using (public.is_admin());

-- delegate_assignments: el delegado ve las suyas, admin ve/edita todas
create policy "delegate_assignments select self or admin" on public.delegate_assignments
  for select using (user_id = auth.uid() or public.is_admin());

create policy "delegate_assignments insert admin only" on public.delegate_assignments
  for insert with check (public.is_admin());

create policy "delegate_assignments update admin only" on public.delegate_assignments
  for update using (public.is_admin());

create policy "delegate_assignments delete admin only" on public.delegate_assignments
  for delete using (public.is_admin());

-- tasks: lectura pública (estudiantes sin cuenta); escritura solo
-- delegado del curso de la tarea, o admin
create policy "tasks select public" on public.tasks
  for select using (true);

create policy "tasks insert delegate or admin" on public.tasks
  for insert with check (
    public.is_admin() or public.is_delegate_for_course(course_id)
  );

create policy "tasks update delegate or admin" on public.tasks
  for update using (
    public.is_admin() or public.is_delegate_for_course(course_id)
  ) with check (
    public.is_admin() or public.is_delegate_for_course(course_id)
  );

create policy "tasks delete delegate or admin" on public.tasks
  for delete using (
    public.is_admin() or public.is_delegate_for_course(course_id)
  );

-- task_attachments: lectura pública; escritura solo delegado del
-- curso de la tarea asociada, o admin
create policy "task_attachments select public" on public.task_attachments
  for select using (true);

create policy "task_attachments insert delegate or admin" on public.task_attachments
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.tasks
      where tasks.id = task_id and public.is_delegate_for_course(tasks.course_id)
    )
  );

create policy "task_attachments delete delegate or admin" on public.task_attachments
  for delete using (
    public.is_admin() or exists (
      select 1 from public.tasks
      where tasks.id = task_id and public.is_delegate_for_course(tasks.course_id)
    )
  );

-- push_subscriptions / push_subscription_courses: anónimas, solo
-- insert/update/delete desde el propio dispositivo (sin lectura
-- pública para no exponer tokens de suscripción de otros).
create policy "push_subscriptions insert anyone" on public.push_subscriptions
  for insert with check (true);

create policy "push_subscriptions update anyone" on public.push_subscriptions
  for update using (true);

create policy "push_subscriptions delete anyone" on public.push_subscriptions
  for delete using (true);

create policy "push_subscription_courses insert anyone" on public.push_subscription_courses
  for insert with check (true);

create policy "push_subscription_courses select anyone" on public.push_subscription_courses
  for select using (true);

create policy "push_subscription_courses delete anyone" on public.push_subscription_courses
  for delete using (true);
