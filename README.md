# UniHM — Tareas universitarias por curso

PWA para que ~40-45 estudiantes vean, sin cuenta, qué tareas tienen pendientes por curso y para cuándo. Delegados (correo + contraseña) registran las tareas; un admin gestiona quiénes son delegados.

Ver [uni-tasks-app-spec.md](../uni-tasks-app-spec.md) para la especificación funcional. El diseño visual viene del proyecto de Claude Design **"Interfaces App con Diseño Tropical"** (`Tareas Uni - Interfaces.dc.html`): fondo crema, acentos naranja/teal/rosa/amarillo/coral/azul/lavanda/menta, tipografía Bricolage Grotesque + DM Sans.

Este repo implementa **Fase 1 (MVP) + Fase 2 (adjuntos)**: auth de delegados/admin, cursos y asignaciones, CRUD de tareas con foto/PDF adjunto, y el lado de estudiante completo (Inicio, Tareas, Detalle, Avisos, Pasadas) con navegación inferior de 4 pestañas.

## Stack

React + Vite + TypeScript, Tailwind CSS v4, Supabase (Postgres + Auth + Storage + RLS), `vite-plugin-pwa`, `react-router-dom`, `browser-image-compression` (cargado on-demand, solo cuando un delegado sube una foto).

## 1. Crear el proyecto de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, corre en orden los archivos de `supabase/migrations/`:
   - `0001_init.sql` — tablas, triggers y políticas RLS.
   - `0002_archive_old_tasks.sql` — archivado automático (requiere la extensión `pg_cron`; actívala en **Database → Extensions** si el `create extension` falla por permisos).
   - `0003_task_attachments_storage.sql` — bucket de Storage para fotos/PDF adjuntos, con sus políticas.
3. En **Authentication → Providers → Email**:
   - Activa **"Confirm email"** — así, al crear cuenta, la persona debe confirmar que controla ese correo antes de poder entrar (mantiene la misma garantía de seguridad que tenía el magic link, pero con login de correo + contraseña de ahí en adelante).
4. En **Authentication → URL Configuration**, agrega `http://localhost:5173/panel` (y tu dominio de producción) a las Redirect URLs, para que el correo de confirmación funcione.

## 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los valores de **Project Settings → API** en Supabase (usa la **publishable key**, nunca la **secret key**, en este `.env`).

## 3. Instalar y correr

```bash
npm install
npm run dev
```

## 4. Crear el primer admin

No hay registro de admin desde la UI (por diseño — evita que cualquiera se auto-asigne). Pasos:

1. Entra a la app en `/login` → "¿Primera vez? Crea tu cuenta" → correo + contraseña. Confirma el correo que te llega. Esto crea tu fila en `public.users` con `role = 'delegado'` (vía trigger).
2. En el **SQL Editor** de Supabase, promociónate a admin:
   ```sql
   update public.users set role = 'admin' where email = 'tu-correo@universidad.edu';
   ```
3. Vuelve a iniciar sesión (o recarga `/panel`) — ahora verás el enlace "Administración". Desde ahí también puedes cambiar el rol de cualquier usuario tocando su chip de rol.

Nuevos delegados siguen el mismo paso 1 por su cuenta; luego el admin los ve en `/admin` y les asigna curso(s).

## Rutas

| Ruta | Quién | Pantalla del diseño |
|---|---|---|
| `/` | Todos | 1a — Inicio: entregas de hoy/mañana, resumen de la semana |
| `/tareas` | Todos | 1b/1c — Lista y grid de todas las tareas, con búsqueda y filtros |
| `/tareas/:id` | Todos | 1d — Detalle de tarea, adjunto, marcar hecho (local) |
| `/avisos` | Todos | 1e — Notificaciones push por curso (ver nota abajo) |
| `/pasadas` | Todos | Tareas archivadas (30+ días vencidas) |
| `/login` | Delegados/admin | 1f — Correo + contraseña (crear cuenta o entrar) |
| `/panel` | Delegados/admin | CRUD de tareas del curso asignado, con adjunto (formulario estilo 1g) |
| `/admin` | Admin | 1h — Cursos (crear/editar/eliminar) y delegados |

Las 4 primeras rutas comparten la barra de navegación inferior (Inicio/Tareas/Avisos/Pasadas); login/panel/admin no la muestran.

## Notas de diseño

- **"Hecho" es local al dispositivo** (localStorage), no se sincroniza entre dispositivos ni se guarda en el servidor.
- **Colores por curso** se asignan por posición en la lista de cursos, ciclando entre 8 colores antes de repetir — ver [src/lib/courseColors.ts](src/lib/courseColors.ts).
- **Adjuntos**: 1 archivo por tarea (imagen o PDF, máx. 10MB), comprimido en el navegador antes de subir. Guardado en el bucket de Storage `task-attachments`, con ruta `{course_id}/{task_id}/{archivo}` para que las políticas RLS reutilicen `is_delegate_for_course()`.
- **Avisos (`/avisos`) es solo el opt-in**, no el envío real. Guarda qué cursos sigue cada dispositivo (tablas `push_subscriptions` / `push_subscription_courses`) y pide el permiso `Notification` del navegador. Falta la Fase 3 completa: claves VAPID + una Edge Function/cron que de verdad envíe el push un día antes de cada entrega a las 19:00.
- **RLS es la única barrera de permisos real.** Antes de producción, probar explícitamente que un delegado de un curso no pueda editar tareas (ni subir/borrar adjuntos) de otro curso.
- **Iconos PWA**: PNGs en `public/` (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png` con margen de seguridad para Android, y `apple-touch-icon.png` para iOS), generados desde `public/favicon.svg`. Si cambias el logo, regénéralos (p. ej. `npx sharp-cli -i favicon.svg -o icon-512.png resize 512 512`).
- **Despliegue**: Vercel, conectado a este repo (cada push a `main` despliega solo). `vercel.json` reescribe todas las rutas a `index.html` para que las rutas del lado del cliente (`/panel`, `/tareas/:id`…) funcionen al entrar directo. Variables de entorno en Vercel: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción (incluye chequeo de tipos)
npm run preview   # sirve el build de producción localmente
```
