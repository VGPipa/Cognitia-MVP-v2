

## Fix: Fallback cuando no existe grupo con la seccion exacta

### Problema

La base de datos solo tiene grupos con seccion "A" para todos los grados. Cuando el profesor selecciona una seccion diferente (ej: "D"), la busqueda falla porque no existe "4 Secundaria seccion D".

### Solucion en `src/pages/profesor/GenerarClase.tsx` (lineas 706-730)

Agregar un fallback: si la busqueda con seccion exacta no encuentra resultado, hacer una segunda busqueda solo por grado (sin filtrar seccion). Asi siempre se encuentra un grupo valido.

```text
// Logica actual (falla si la seccion no existe):
if (formData.seccion) {
  grupoQuery = grupoQuery.eq('seccion', formData.seccion);
}
const { data: grupoEncontrado } = await grupoQuery.limit(1).maybeSingle();
if (!grupoEncontrado) throw new Error(...)

// Nueva logica con fallback:
if (formData.seccion) {
  grupoQuery = grupoQuery.eq('seccion', formData.seccion);
}
let { data: grupoEncontrado } = await grupoQuery.limit(1).maybeSingle();

// Fallback: si no encuentra con seccion exacta, buscar solo por grado
if (!grupoEncontrado && formData.seccion) {
  const { data: grupoFallback } = await supabase
    .from('grupos')
    .select('id, nombre, grado, seccion')
    .eq('grado', gradoBuscado)
    .limit(1)
    .maybeSingle();
  grupoEncontrado = grupoFallback;
}

if (!grupoEncontrado) {
  throw new Error('No se encontro un grupo...');
}
```

Esto asegura que siempre se encuentre un grupo del grado correcto, independientemente de si la seccion especifica existe o no en la base de datos.

### Archivos modificados

Solo `src/pages/profesor/GenerarClase.tsx` -- un bloque de ~10 lineas adicionales.
