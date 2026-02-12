-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Profesores can manage own clases" ON clases;

-- Recreate with 3 paths: plan-based, extraordinary, and draft
CREATE POLICY "Profesores can manage own clases" ON clases
FOR ALL TO authenticated
USING (
  id_profesor IN (SELECT p.id FROM profesores p WHERE p.user_id = auth.uid())
  AND (
    -- Path A: clase con tema del plan -> requiere asignacion
    (id_tema IS NOT NULL AND EXISTS (
      SELECT 1 FROM temas_plan tp
      JOIN asignaciones_profesor ap ON ap.id_materia = tp.curso_plan_id
      WHERE tp.id = clases.id_tema
        AND ap.id_profesor = clases.id_profesor
        AND ap.id_grupo = clases.id_grupo
    ))
    OR
    -- Path B: clase extraordinaria -> solo verificar misma institucion
    (id_tema IS NULL AND tema_personalizado IS NOT NULL AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = clases.id_grupo
        AND g.id_institucion = get_user_institucion(auth.uid())
    ))
    OR
    -- Path C: clase borrador sin tema, requiere asignacion al grupo
    (id_tema IS NULL AND tema_personalizado IS NULL AND EXISTS (
      SELECT 1 FROM asignaciones_profesor ap
      WHERE ap.id_profesor = clases.id_profesor
        AND ap.id_grupo = clases.id_grupo
    ))
  )
)
WITH CHECK (
  id_profesor IN (SELECT p.id FROM profesores p WHERE p.user_id = auth.uid())
  AND (
    (id_tema IS NOT NULL AND EXISTS (
      SELECT 1 FROM temas_plan tp
      JOIN asignaciones_profesor ap ON ap.id_materia = tp.curso_plan_id
      WHERE tp.id = clases.id_tema
        AND ap.id_profesor = clases.id_profesor
        AND ap.id_grupo = clases.id_grupo
    ))
    OR
    (id_tema IS NULL AND tema_personalizado IS NOT NULL AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = clases.id_grupo
        AND g.id_institucion = get_user_institucion(auth.uid())
    ))
    OR
    (id_tema IS NULL AND tema_personalizado IS NULL AND EXISTS (
      SELECT 1 FROM asignaciones_profesor ap
      WHERE ap.id_profesor = clases.id_profesor
        AND ap.id_grupo = clases.id_grupo
    ))
  )
);