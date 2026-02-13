

## Quitar el campo "Grupo asignado" en clases extraordinarias

### Problema

Actualmente, al crear una clase extraordinaria, se muestra un selector de "Grupo asignado" que solo lista los grupos formalmente asignados al profesor. Esto es innecesario y contradice la logica original: para clases extraordinarias, el sistema debe buscar automaticamente el grupo correcto basandose en Nivel + Grado + Seccion, sin requerir asignacion formal.

La politica RLS ya permite esto (Path B: solo verifica misma institucion).

### Cambios en `src/pages/profesor/GenerarClase.tsx`

1. **Eliminar el selector "Grupo asignado"** (lineas 1520-1557): Quitar todo el bloque condicional que muestra el select de grupos para extraordinarias.

2. **Modificar `ensureClase`** (lineas 691-728): Para clases extraordinarias, en lugar de exigir `grupoData` pre-seleccionado, buscar el grupo globalmente en la tabla `grupos` filtrando por grado, seccion e institucion del profesor:

```text
if (isExtraordinaria && !grupoData) {
  // Buscar grupo por nivel/grado/seccion en la institucion del profesor
  const gradoBuscado = `${formData.grado} ${formData.nivel}`;
  const { data: grupoEncontrado } = await supabase
    .from('grupos')
    .select('id, nombre, grado, seccion')
    .ilike('grado', `%${formData.grado}%${formData.nivel}%`)
    .eq('seccion', formData.seccion)
    .limit(1)
    .single();
  
  if (grupoEncontrado) {
    groupToUse = grupoEncontrado;
  } else {
    throw new Error('No se encontro un grupo que coincida...');
  }
}
```

3. **Quitar validacion de grupo en `handleGenerarGuia`** (lineas 927-934): Eliminar el check `if (isExtraordinaria && !grupoData?.id)`.

4. **Quitar "Grupo asignado" de `getMissingFields`** (lineas 1078-1079): Eliminar la linea que agrega 'Grupo asignado' a los campos faltantes.

5. **Quitar validacion en `ensureClase`** (lineas 710-712): Eliminar el check que exige que el grupo este en la lista de grupos asignados del profesor.

### Flujo resultante para extraordinarias

```text
Profesor selecciona:
  Nivel (Inicial/Primaria/Secundaria)
  Grado (segun nivel)
  Seccion (A, B, C...)
  Tema personalizado
  
Al generar -> ensureClase busca grupo en DB
  por grado + seccion + institucion
  -> Inserta clase con ese grupo
  -> RLS Path B lo permite (misma institucion)
```

### Archivos modificados

Solo `src/pages/profesor/GenerarClase.tsx` -- 5 cambios puntuales, sin cambios en DB.
