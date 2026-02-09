-- Generation flow hardening: data security, extraordinary support, and policy performance

-- 1) Support extraordinary draft resume
ALTER TABLE public.clases
ADD COLUMN IF NOT EXISTS tema_personalizado text;

-- 2) Supporting indexes for policies and read paths
CREATE INDEX IF NOT EXISTS idx_clases_profesor_tema_estado_fecha
  ON public.clases (id_profesor, id_tema, estado, fecha_programada);

CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_grupo_materia
  ON public.asignaciones_profesor (id_profesor, id_grupo, id_materia);

CREATE INDEX IF NOT EXISTS idx_guias_tema_profesor_tema
  ON public.guias_tema (id_profesor, id_tema);

-- 3) De-duplicate guias_tema by (id_profesor, id_tema), keep latest
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT id_profesor, id_tema, COUNT(*) AS total
      FROM public.guias_tema
      GROUP BY id_profesor, id_tema
      HAVING COUNT(*) > 1
    ) dup
  ) THEN
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY id_profesor, id_tema
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
        ) AS rn
      FROM public.guias_tema
    )
    DELETE FROM public.guias_tema gt
    USING ranked r
    WHERE gt.id = r.id
      AND r.rn > 1;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM (
      SELECT id_profesor, id_tema, COUNT(*) AS total
      FROM public.guias_tema
      GROUP BY id_profesor, id_tema
      HAVING COUNT(*) > 1
    ) dup
  ) THEN
    RAISE EXCEPTION 'Unable to enforce unique (id_profesor, id_tema) on guias_tema';
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_guias_tema_profesor_tema
  ON public.guias_tema (id_profesor, id_tema);

-- 4) Replace permissive read policies
DROP POLICY IF EXISTS "Users can view clases" ON public.clases;
DROP POLICY IF EXISTS "Users can view guias_versiones" ON public.guias_clase_versiones;
DROP POLICY IF EXISTS "Users can view guias_tema" ON public.guias_tema;

DROP POLICY IF EXISTS "Admin can read clases" ON public.clases;
DROP POLICY IF EXISTS "Profesores can read own clases" ON public.clases;
DROP POLICY IF EXISTS "Admin can read guias_tema" ON public.guias_tema;
DROP POLICY IF EXISTS "Profesores can read own guias_tema" ON public.guias_tema;
DROP POLICY IF EXISTS "Admin can read guias_versiones" ON public.guias_clase_versiones;
DROP POLICY IF EXISTS "Profesores can read own guias_versiones" ON public.guias_clase_versiones;

CREATE POLICY "Admin can read clases"
ON public.clases
FOR SELECT
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Profesores can read own clases"
ON public.clases
FOR SELECT
TO authenticated
USING (
  id_profesor IN (
    SELECT p.id
    FROM public.profesores p
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admin can read guias_tema"
ON public.guias_tema
FOR SELECT
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Profesores can read own guias_tema"
ON public.guias_tema
FOR SELECT
TO authenticated
USING (
  id_profesor IN (
    SELECT p.id
    FROM public.profesores p
    WHERE p.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admin can read guias_versiones"
ON public.guias_clase_versiones
FOR SELECT
TO authenticated
USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Profesores can read own guias_versiones"
ON public.guias_clase_versiones
FOR SELECT
TO authenticated
USING (
  id_clase IN (
    SELECT c.id
    FROM public.clases c
    JOIN public.profesores p ON p.id = c.id_profesor
    WHERE p.user_id = (SELECT auth.uid())
  )
);

-- 5) Strengthen teacher write checks for clases
DROP POLICY IF EXISTS "Profesores can manage own clases" ON public.clases;

CREATE POLICY "Profesores can manage own clases"
ON public.clases
FOR ALL
TO authenticated
USING (
  id_profesor IN (
    SELECT p.id
    FROM public.profesores p
    WHERE p.user_id = (SELECT auth.uid())
  )
  AND (
    (
      id_tema IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.asignaciones_profesor ap
        WHERE ap.id_profesor = public.clases.id_profesor
          AND ap.id_grupo = public.clases.id_grupo
      )
    )
    OR
    (
      id_tema IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.temas_plan tp
        JOIN public.asignaciones_profesor ap ON ap.id_materia = tp.curso_plan_id
        WHERE tp.id = public.clases.id_tema
          AND ap.id_profesor = public.clases.id_profesor
          AND ap.id_grupo = public.clases.id_grupo
      )
    )
  )
)
WITH CHECK (
  id_profesor IN (
    SELECT p.id
    FROM public.profesores p
    WHERE p.user_id = (SELECT auth.uid())
  )
  AND (
    (
      id_tema IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.asignaciones_profesor ap
        WHERE ap.id_profesor = public.clases.id_profesor
          AND ap.id_grupo = public.clases.id_grupo
      )
    )
    OR
    (
      id_tema IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.temas_plan tp
        JOIN public.asignaciones_profesor ap ON ap.id_materia = tp.curso_plan_id
        WHERE tp.id = public.clases.id_tema
          AND ap.id_profesor = public.clases.id_profesor
          AND ap.id_grupo = public.clases.id_grupo
      )
    )
  )
);
