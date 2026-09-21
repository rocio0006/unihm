-- Abreviación opcional por curso, para espacios compactos (chips de
-- filtro, selector de curso al crear tarea). Si está vacía, la UI usa
-- el nombre completo.

alter table public.courses add column short_name text;
