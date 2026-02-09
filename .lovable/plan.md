

## Apply Migration: `20260209210000_generation_flow_hardening`

This migration file already exists in the repository. It needs to be applied to the database. No application code will be modified.

### What the migration does

1. **Adds `tema_personalizado` column** to the `clases` table (text, nullable) to support extraordinary/custom class topics.

2. **Creates performance indexes** on:
   - `clases (id_profesor, id_tema, estado, fecha_programada)`
   - `asignaciones_profesor (id_profesor, id_grupo, id_materia)`
   - `guias_tema (id_profesor, id_tema)`

3. **De-duplicates `guias_tema`** rows by `(id_profesor, id_tema)`, keeping the latest, then enforces a unique constraint.

4. **Replaces permissive `USING(true)` SELECT policies** on `clases`, `guias_tema`, and `guias_clase_versiones` with scoped role-based policies:
   - Admins can read all rows.
   - Profesores can only read their own rows (via `profesores.user_id`).

5. **Strengthens the teacher write policy** on `clases` to verify the professor has a valid assignment (`asignaciones_profesor`) for the group/topic combination.

### Execution

The migration tool will be used to apply the exact SQL from the file. No frontend or TypeScript files will be touched.

