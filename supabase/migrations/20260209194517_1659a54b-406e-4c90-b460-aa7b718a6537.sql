
-- Drop RLS policies
DROP POLICY IF EXISTS "Admin can manage respuestas_detalle" ON public.respuestas_detalle;
DROP POLICY IF EXISTS "Alumnos can manage own respuestas_detalle" ON public.respuestas_detalle;
DROP POLICY IF EXISTS "Profesores can view respuestas_detalle" ON public.respuestas_detalle;
DROP POLICY IF EXISTS "Admin can manage nota_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Alumnos can manage own nota_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Profesores can view nota_alumno" ON public.nota_alumno;
DROP POLICY IF EXISTS "Admin can manage recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Profesores can manage recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Users can view recomendaciones" ON public.recomendaciones;
DROP POLICY IF EXISTS "Admin can manage preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Profesores can manage preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Users can view preguntas" ON public.preguntas;
DROP POLICY IF EXISTS "Admin can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Alumnos can view published quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Profesores can manage quizzes" ON public.quizzes;

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.respuestas_detalle;
DROP TABLE IF EXISTS public.nota_alumno;
DROP TABLE IF EXISTS public.recomendaciones;
DROP TABLE IF EXISTS public.preguntas;
DROP TABLE IF EXISTS public.quizzes;

-- Drop enums
DROP TYPE IF EXISTS public.estado_quiz;
DROP TYPE IF EXISTS public.estado_respuesta;
DROP TYPE IF EXISTS public.tipo_pregunta;
DROP TYPE IF EXISTS public.tipo_quiz;
