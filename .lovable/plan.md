

## Fix: Busqueda de grupo falla cuando seccion esta vacia

### Problema

El error "No se encontro un grupo para 3 Primaria seccion ." ocurre porque:
- La seccion se dejo como "Opcional" (valor vacio)
- Todos los grupos en la DB tienen seccion "A"
- La query filtra con `.eq('seccion', '')` que no encuentra nada

### Cambio en `src/pages/profesor/GenerarClase.tsx` (lineas 706-721)

Modificar la logica de busqueda del grupo en `ensureClase`:

1. Construir el valor de grado esperado como `${formData.grado}° ${formData.nivel}` (ej: "3° Primaria") para hacer un match exacto con el campo `grado` de la tabla `grupos`
2. Si `formData.seccion` tiene valor, filtrar por seccion. Si esta vacio, no filtrar por seccion y tomar el primer resultado disponible

```text
// Antes (falla con seccion vacia):
.ilike('grado', `%${formData.grado}%${formData.nivel}%`)
.eq('seccion', formData.seccion || '')

// Despues:
let gradoBuscado: string;
if (formData.nivel === 'Inicial') {
  gradoBuscado = `${formData.grado} años`;
} else {
  gradoBuscado = `${formData.grado}° ${formData.nivel}`;
}

let query = supabase
  .from('grupos')
  .select('id, nombre, grado, seccion')
  .eq('grado', gradoBuscado);

if (formData.seccion) {
  query = query.eq('seccion', formData.seccion);
}

const { data: grupoEncontrado } = await query.limit(1).maybeSingle();
```

### Caso especial: Nivel Inicial

Los grupos de Inicial tienen grado como "3 anos", "4 anos", "5 anos" (sin el simbolo de grado), asi que se maneja por separado.

### Archivos modificados

Solo `src/pages/profesor/GenerarClase.tsx` -- un bloque de ~15 lineas.
