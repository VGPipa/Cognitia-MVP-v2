

## Habilitar Creación de Sesiones para agomez

### Estado Actual
- **Usuario**: Angelo Gomez (agomez@gmail.com)
- **Profesor ID**: `2df76ad0-cf51-4ea9-8882-c545d0d8810e`
- **Rol**: Profesor (activo)
- **Asignaciones actuales**: Ninguna

### Solución
Crear asignaciones en la tabla `asignaciones_profesor` para vincular a agomez con grupos y cursos específicos. Esto le permitira:

1. Ver cursos en la sección "Planificación"
2. Crear sesiones vinculadas a temas del plan curricular
3. Acceder a todos los flujos de generación de guías de clase

### Cambios en Base de Datos

Insertar asignaciones para agomez usando los grupos y cursos existentes:

| Grupo | Grado | Curso |
|-------|-------|-------|
| 1° Primaria A | 1° Primaria | Comunicación |
| 1° Primaria A | 1° Primaria | Matemática |
| 2° Primaria A | 2° Primaria | Comunicación |
| 2° Primaria A | 2° Primaria | Matemática |

**SQL a ejecutar:**
```text
INSERT INTO asignaciones_profesor (id_profesor, id_grupo, id_materia, anio_escolar)
VALUES 
  -- 1° Primaria A - Comunicación
  ('2df76ad0-cf51-4ea9-8882-c545d0d8810e', 'b17a3af8-ef34-401b-83dd-fe0011c6e010', '33333333-3333-3333-3333-333333333301', '2025'),
  -- 1° Primaria A - Matemática
  ('2df76ad0-cf51-4ea9-8882-c545d0d8810e', 'b17a3af8-ef34-401b-83dd-fe0011c6e010', '33333333-3333-3333-3333-333333333304', '2025'),
  -- 2° Primaria A - Comunicación
  ('2df76ad0-cf51-4ea9-8882-c545d0d8810e', 'b092525d-46ad-472d-9951-0e87c6c7b60a', '33333333-3333-3333-3333-333333333302', '2025'),
  -- 2° Primaria A - Matemática
  ('2df76ad0-cf51-4ea9-8882-c545d0d8810e', 'b092525d-46ad-472d-9951-0e87c6c7b60a', '33333333-3333-3333-3333-333333333305', '2025');
```

### Resultado Esperado
- agomez podrá acceder a "Planificación" y ver los cursos asignados
- Podrá iniciar temas y programar sesiones desde el flujo normal
- Tambien podrá seguir creando Clases Extraordinarias si lo necesita

### Notas
- No se requieren cambios de codigo, solo insercion de datos
- Las asignaciones usan el año escolar 2025 (actual)
- Los grupos y cursos seleccionados ya existen en la base de datos

