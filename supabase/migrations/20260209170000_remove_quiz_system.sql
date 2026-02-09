-- Remove Quiz System
-- Drops quiz tables, enums, RLS policies, and indexes in correct dependency order
-- Following supabase-postgres-best-practices: clean up policies before dropping tables,
-- drop children before parents (dependency order)

BEGIN;

-- 1. Drop RLS policies (security-rls-basics: clean up policies before dropping tables)
DROP POLICY IF EXISTS "Admin can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Alumnos can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Profesores can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Admin can manage preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Profesores can manage preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Users can view preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Admin can manage nota_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Alumnos can manage own nota_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Profesores can view nota_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Admin can manage respuestas_detalle" ON public.respuestas_detalle;
DROP POLICY IF EXISTS "Alumnos can manage own respuestas_detalle" ON public.respuestas_detalle;
DROP POLICY IF EXISTS "Profesores can view respuestas_detalle" ON public.respuestas_detalle;
DROP POLICY IF EXISTS "Admin can manage recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Profesores can manage recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Users can view recomendaciones" ON public.recomendaciones;

-- 2. Drop tables in dependency order (children first, parents last)
DROP TABLE IF EXISTS public.respuestas_detalle CASCADE;
DROP TABLE IF EXISTS public.nota_alumno CASCADE;
DROP TABLE IF EXISTS public.preguntas CASCADE;
DROP TABLE IF EXISTS public.recomendaciones CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;

-- 3. Update estado_clase enum: remove 'analizando_resultados'
UPDATE public.clases SET estado = 'completada'
  WHERE estado = 'analizando_resultados';

CREATE TYPE public.estado_clase_new AS ENUM (
  'borrador','generando_clase','editando_guia','guia_aprobada',
  'clase_programada','en_clase','completada'
);
ALTER TABLE public.clases
  ALTER COLUMN estado DROP DEFAULT,
  ALTER COLUMN estado TYPE public.estado_clase_new
    USING estado::text::public.estado_clase_new,
  ALTER COLUMN estado SET DEFAULT 'borrador'::public.estado_clase_new;
DROP TYPE public.estado_clase;
ALTER TYPE public.estado_clase_new RENAME TO estado_clase;

-- 4. Drop quiz-specific enums
DROP TYPE IF EXISTS public.tipo_quiz;
DROP TYPE IF EXISTS public.estado_quiz;
DROP TYPE IF EXISTS public.tipo_pregunta;
DROP TYPE IF EXISTS public.estado_respuesta;

COMMIT;
