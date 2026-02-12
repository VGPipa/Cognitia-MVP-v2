

## Fix: Error RLS en tabla `clases` para profesores sin asignaciones

### Problema detectado

La politica RLS "Profesores can manage own clases" exige que el profesor tenga una fila en `asignaciones_profesor` que coincida con el grupo (y opcionalmente tema) de la clase. **7 profesores tienen 0 asignaciones**, por lo que toda insercion es bloqueada:

| Profesor | Asignaciones |
|----------|-------------|
| jespinoza@gmail.com | 0 |
| emprelatam@gmail.com | 0 |
| docente@gmail.com | 0 |
| mrodriguez@gmail.com | 0 |
| rvargas@gmail.com | 0 |
| rcaceres@gmail.com | 0 |
| lramirez@gmail.com | 0 |

### Solucion (2 partes, solo DB, sin cambios frontend)

#### Parte 1 -- Crear asignaciones para jespinoza

Insertar asignaciones de Comunicacion y Matematica para 3 Secundaria A (como ejemplo razonable). Se puede ajustar despues desde el panel de admin.

```sql
INSERT INTO asignaciones_profesor (id_profesor, id_materia, id_grupo, anio_escolar)
VALUES
  ('56a2004b-8abc-4b68-aa2e-748c74fedc5e', '33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', '2025'),
  ('56a2004b-8abc-4b68-aa2e-748c74fedc5e', '33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111102', '2025');
```

#### Parte 2 -- Relajar la politica RLS para clases extraordinarias

Reemplazar la politica "Profesores can manage own clases" para permitir dos caminos:

1. **Clase con tema del plan** (id_tema IS NOT NULL): requiere asignacion en `asignaciones_profesor` (como ahora).
2. **Clase extraordinaria** (id_tema IS NULL y tema_personalizado IS NOT NULL): solo requiere que el profesor pertenezca a la misma institucion que el grupo, sin necesidad de asignacion formal.

```text
Migration SQL (esquema simplificado):

DROP POLICY "Profesores can manage own clases" ON clases;

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
    -- Path B: clase extraordinaria -> solo verificar mismo institucion
    (id_tema IS NULL AND tema_personalizado IS NOT NULL AND EXISTS (
      SELECT 1 FROM grupos g
      WHERE g.id = clases.id_grupo
        AND g.id_institucion = get_user_institucion(auth.uid())
    ))
    OR
    -- Path C: clase sin tema asignada a grupo con asignacion (borrador)
    (id_tema IS NULL AND tema_personalizado IS NULL AND EXISTS (
      SELECT 1 FROM asignaciones_profesor ap
      WHERE ap.id_profesor = clases.id_profesor
        AND ap.id_grupo = clases.id_grupo
    ))
  )
)
WITH CHECK ( /* misma logica */ );
```

### Resultado esperado

- jespinoza podra crear clases extraordinarias en cualquier grupo de su institucion
- Profesores con asignaciones seguiran creando clases normales vinculadas al plan
- La seguridad se mantiene: un profesor no puede operar sobre grupos de otra institucion

### Archivos modificados

Ninguno. Solo cambios en la base de datos (1 data insert + 1 migration).
