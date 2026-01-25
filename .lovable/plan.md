

## Corrección de Proporción del Logo Nitia

### Problema Identificado
El logo actualmente usa solo altura fija (`h-20`, `h-28`, `h-36`) con `w-auto`, lo que hace que la imagen se vea cuadrada o con poca visibilidad del texto "Nitia". Se necesita una proporción más horizontal para que el nombre sea legible.

### Solución Propuesta
Modificar el componente `Logo.tsx` para usar dimensiones que favorezcan una proporción horizontal, manteniendo una altura moderada pero permitiendo un ancho amplio.

### Cambios Técnicos

**Archivo: `src/components/Logo.tsx`**

Ajustar las clases de tamaño para usar anchos explícitos que creen una proporción horizontal:

| Tamaño | Antes | Después |
|--------|-------|---------|
| `sm` (Sidebar) | `h-20` | `w-48 h-12` (proporción ~4:1) |
| `md` | `h-28` | `w-64 h-16` (proporción ~4:1) |
| `lg` (Login) | `h-36` | `w-80 h-20` (proporción ~4:1) |

**Nota:** Una proporción 1:15 literal sería extremadamente alargada. La proporción ~4:1 (ancho 4 veces mayor que alto) es más práctica y asegura que el logo sea legible mientras cabe en los contenedores existentes (el sidebar tiene `w-64` = 256px de ancho).

### Resultado Esperado
- El logo se mostrará en formato horizontal con el texto "Nitia" claramente visible
- Se mantendrá `object-contain` para preservar la imagen sin distorsión
- El sidebar (256px de ancho) podrá contener cómodamente el logo `sm` de 192px de ancho

