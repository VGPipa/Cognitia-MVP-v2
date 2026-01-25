

## Ajuste del Tamaño del Logo Nitia

### Problema Actual
El logo actual tiene tamaño `sm: 'w-48 h-12'` (192×48px), pero la clase `w-auto` en el `<img>` está sobrescribiendo el ancho definido. Además, comparando con la imagen de referencia, el logo necesita ser significativamente más grande para que el texto "Nitia" sea fácilmente legible.

### Análisis de la Imagen de Referencia
En la imagen proporcionada, el logo:
- Ocupa casi todo el ancho disponible del sidebar (~220px de un sidebar de 256px)
- Tiene una altura considerable (~60-70px)
- Se lee claramente "Nitia" con el ícono decorativo

### Cambios Técnicos

**Archivo: `src/components/Logo.tsx`**

1. **Aumentar los tamaños de todas las variantes:**

| Tamaño | Actual | Nuevo |
|--------|--------|-------|
| `sm` (Sidebar) | `w-48 h-12` (192×48px) | `w-56 h-16` (224×64px) |
| `md` | `w-64 h-16` | `w-72 h-20` |
| `lg` (Login) | `w-80 h-20` | `w-96 h-24` |

2. **Corregir la clase del `<img>`:**
   - Cambiar `className={cn(sizes[size], 'w-auto object-contain')}` 
   - A `className={cn(sizes[size], 'object-contain')}` 
   - Esto elimina `w-auto` que estaba sobrescribiendo el ancho definido

### Resultado Esperado
- El logo en el sidebar será más grande y prominente, similar a la imagen de referencia
- El texto "Nitia" será fácilmente legible
- El logo cabrá cómodamente en el sidebar de 256px de ancho

