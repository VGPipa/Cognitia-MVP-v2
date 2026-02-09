

# Limpieza de Base de Datos: Eliminar tablas y enums de Quiz

## Estado Actual

- **5 tablas de quiz** con 0 registros: `quizzes`, `preguntas`, `nota_alumno`, `respuestas_detalle`, `recomendaciones`
- **4 enums relacionados**: `estado_quiz`, `estado_respuesta`, `tipo_pregunta`, `tipo_quiz`
- **15 politicas RLS** en esas 5 tablas
- **2 edge functions** en el codigo (ya desplegadas): `generate-guia-clase` y `generate-desempenos`
- No hay edge functions de quiz en el codigo (solo las 2 de arriba)

## Lo que hara la migracion

Una sola migracion SQL que:

1. **Elimina 15 politicas RLS** de las 5 tablas de quiz
2. **Elimina 5 tablas** (en orden correcto por dependencias):
   - `respuestas_detalle` (depende de `nota_alumno` y `preguntas`)
   - `nota_alumno` (depende de `quizzes`)
   - `recomendaciones` (depende de `quizzes`)
   - `preguntas` (depende de `quizzes`)
   - `quizzes` (depende de `clases`)
3. **Elimina 4 enums**: `estado_quiz`, `estado_respuesta`, `tipo_pregunta`, `tipo_quiz`

## Impacto en el codigo

- No hay queries del frontend a estas tablas, por lo que no se requieren cambios en el codigo React
- Los tipos en `src/integrations/supabase/types.ts` se actualizaran automaticamente despues de la migracion
- Las 2 edge functions desplegadas (`generate-guia-clase`, `generate-desempenos`) no se ven afectadas

## Seguridad

- Todas las tablas tienen 0 registros, no se pierde ningun dato
- No hay datos en el entorno Live que preservar

