
-- Update any rows with 'analizando_resultados' to 'completada'
UPDATE public.clases SET estado = 'completada' WHERE estado = 'analizando_resultados';

-- Recreate enum without 'analizando_resultados'
ALTER TYPE public.estado_clase RENAME TO estado_clase_old;

CREATE TYPE public.estado_clase AS ENUM (
  'borrador',
  'generando_clase',
  'editando_guia',
  'guia_aprobada',
  'clase_programada',
  'en_clase',
  'completada'
);

ALTER TABLE public.clases 
  ALTER COLUMN estado DROP DEFAULT,
  ALTER COLUMN estado TYPE public.estado_clase USING estado::text::public.estado_clase,
  ALTER COLUMN estado SET DEFAULT 'borrador'::public.estado_clase;

DROP TYPE public.estado_clase_old;
