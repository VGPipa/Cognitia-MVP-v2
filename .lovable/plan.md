

# Guía Completa: Configurar Supabase Externo para Colaborador

Esta guía detalla paso a paso cómo tu colaborador puede configurar su propio entorno de Supabase usando el código del repositorio GitHub.

---

## Información del Proyecto

| Elemento | Valor |
|----------|-------|
| **Repositorio GitHub** | `https://github.com/[tu-usuario]/smart-learning-studio` |
| **URL Publicada** | https://smart-learning-studio.lovable.app |
| **Total de Tablas** | 28 tablas |
| **Total de Migraciones** | 7 archivos SQL |
| **Edge Functions** | 5 funciones |

---

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/[tu-usuario]/smart-learning-studio.git
cd smart-learning-studio
npm install
```

---

## Paso 2: Crear Proyecto en Supabase

1. Ir a https://supabase.com/dashboard
2. Click en **"New Project"**
3. Configurar:
   - **Name**: `smart-learning-studio-dev`
   - **Database Password**: (guardar en lugar seguro)
   - **Region**: Elegir la más cercana (ej: South America - São Paulo)
4. Esperar ~2 minutos a que se cree el proyecto
5. Anotar:
   - **Project ID**: Visible en la URL del dashboard (`https://supabase.com/dashboard/project/[PROJECT_ID]`)
   - **API URL**: En Settings → API → Project URL
   - **Anon Key**: En Settings → API → Project API keys → `anon public`

---

## Paso 3: Instalar y Configurar Supabase CLI

```bash
# Instalar CLI (macOS/Linux)
brew install supabase/tap/supabase

# O con npm
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular proyecto (reemplazar [PROJECT_ID] con el ID real)
supabase link --project-ref [PROJECT_ID]
# Te pedirá el Database Password del Paso 2
```

---

## Paso 4: Aplicar las Migraciones

El proyecto tiene **7 archivos de migración** en `/supabase/migrations/`:

| Archivo | Contenido |
|---------|-----------|
| `20260105052817_remix_migration_from_pg_dump.sql` | Schema completo inicial (ENUMs, tablas, funciones) |
| `20260105053808_*.sql` | Ajustes adicionales |
| `20260105054452_*.sql` | Políticas RLS |
| `20260105060338_*.sql` | Triggers y funciones |
| `20260105062311_*.sql` | Configuración auth |
| `20260105065618_*.sql` | Datos maestros |
| `20260121152434_*.sql` | Últimas actualizaciones |

**Ejecutar migraciones:**

```bash
supabase db push
```

Esto creará:
- 4 ENUMs: `app_role`, `estado_clase`, `estado_quiz`, `estado_respuesta`, `plan_estado`, `relacion_apoderado`, `tipo_pregunta`
- 28 tablas con sus relaciones
- Políticas RLS para seguridad
- Funciones: `has_role()`, `get_user_institucion()`, `handle_new_user()`
- Trigger para creación automática de perfiles

---

## Paso 5: Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
# Reemplazar con los valores de TU proyecto Supabase
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[TU_ANON_KEY]
VITE_SUPABASE_PROJECT_ID=[PROJECT_ID]
```

**Ejemplo con valores ficticios:**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=abcdefghijklmnop
```

---

## Paso 6: Desplegar Edge Functions

El proyecto tiene **5 Edge Functions** que usan IA para generar contenido educativo:

```bash
# Desplegar todas las funciones
supabase functions deploy generate-guia-clase
supabase functions deploy generate-quiz-pre
supabase functions deploy generate-quiz-post
supabase functions deploy generate-recomendaciones
supabase functions deploy generate-desempenos
```

---

## Paso 7: Configurar Secrets para Edge Functions

Las Edge Functions requieren una API key para el servicio de IA.

**Opción A: Usar API Key de OpenAI (recomendado para desarrollo independiente)**

```bash
# Configurar OpenAI API Key
supabase secrets set OPENAI_API_KEY=sk-...tu-api-key...
```

Luego modificar las Edge Functions para usar OpenAI en lugar del gateway de Lovable. Por ejemplo, en `generate-guia-clase/index.ts`:

```typescript
// Cambiar de:
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', ...);

// A:
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    ...
  },
  body: JSON.stringify({
    model: 'gpt-4o', // o gpt-3.5-turbo para menor costo
    ...
  }),
});
```

**Opción B: Mantener Lovable API (si tu colaborador tiene acceso)**

```bash
supabase secrets set LOVABLE_API_KEY=[API_KEY_PROPORCIONADA]
```

---

## Paso 8: Importar Datos Maestros

Los datos que necesitas exportar e importar son:

| Tabla | Registros | Descripción |
|-------|-----------|-------------|
| `instituciones` | 1 | Institución Demo |
| `areas_curriculares` | 16 | Matemática, Comunicación, Ciencias, etc. |
| `competencias_cneb` | 43 | Competencias del currículo nacional |
| `capacidades_cneb` | 153 | Capacidades por competencia |
| `enfoques_transversales` | 7 | Enfoques educativos |
| `tipos_adaptacion` | 12 | Adaptaciones para NEE |
| `grupos` | 14 | 1°A, 1°B, 2°A, etc. |
| `anios_escolares` | 1 | Año 2025 |

**Exportar desde Lovable Cloud:**
1. Ir a Cloud View → Database → Tables
2. Para cada tabla, click en Export (CSV o JSON)
3. Guardar los archivos

**Importar en Supabase Dashboard:**
1. Ir a Table Editor en el Dashboard de Supabase
2. Seleccionar cada tabla
3. Click en "Import data from CSV"
4. Subir el archivo correspondiente

**O usar SQL directo** (ejemplo para institución):

```sql
INSERT INTO instituciones (id, nombre) VALUES 
('00000000-0000-0000-0000-000000000001', 'Institución Demo');
```

---

## Paso 9: Crear Usuarios de Prueba

En el Dashboard de Supabase → Authentication → Users → Add user:

### Usuario Docente
```
Email: docente@gmail.com
Password: admin123
```

Después de crear, ejecutar en SQL Editor:

```sql
-- Obtener el user_id del usuario recién creado
-- (verificar en Authentication → Users)

-- Asumiendo que el user_id es 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
INSERT INTO profiles (user_id, email, nombre, apellido, id_institucion)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'docente@gmail.com',
  'Profesor',
  'Demo',
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO user_roles (user_id, role, id_institucion)
VALUES (
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  'profesor',
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO profesores (user_id)
VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

-- Repetir similar para el alumno
```

### Usuario Alumno
```
Email: alumno@gmail.com
Password: admin123
```

---

## Paso 10: Configurar Auth (Opcional)

En Dashboard → Authentication → Providers:

1. **Email**: Habilitado por defecto
2. **Confirm email**: Desactivar para desarrollo local
   - Settings → Auth → "Enable email confirmations" → OFF

---

## Paso 11: Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## Resumen de Archivos a Compartir con tu Colaborador

1. **Acceso al repositorio GitHub** (ya lo tiene)
2. **Archivo de datos exportados** (CSV/JSON de las tablas maestras)
3. **Esta guía** con los pasos detallados

---

## Estructura de Tablas Principales

```text
┌─────────────────────────────────────────────────────────────┐
│                    TABLAS DE REFERENCIA                      │
├─────────────────────────────────────────────────────────────┤
│ instituciones (1)                                            │
│ areas_curriculares (16) → competencias_cneb (43)            │
│                         → capacidades_cneb (153)            │
│ enfoques_transversales (7)                                  │
│ tipos_adaptacion (12)                                       │
│ grupos (14)                                                 │
│ anios_escolares (1)                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TABLAS DE USUARIOS                        │
├─────────────────────────────────────────────────────────────┤
│ profiles → user_roles                                        │
│         → profesores (11)                                   │
│         → alumnos (3)                                       │
│         → apoderados                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TABLAS DE CONTENIDO                       │
├─────────────────────────────────────────────────────────────┤
│ planes_anuales (5) → cursos_plan (10) → temas_plan (12)     │
│ asignaciones_profesor                                        │
│ clases → guias_tema → guias_clase_versiones                 │
│       → quizzes → preguntas                                 │
│                 → nota_alumno → respuestas_detalle          │
│                 → recomendaciones                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist Final

- [ ] Proyecto Supabase creado
- [ ] CLI vinculado al proyecto
- [ ] Migraciones aplicadas (`supabase db push`)
- [ ] `.env.local` configurado
- [ ] Edge Functions desplegadas
- [ ] Secrets configurados (OPENAI_API_KEY o LOVABLE_API_KEY)
- [ ] Datos maestros importados
- [ ] Usuarios de prueba creados
- [ ] Aplicación ejecutándose en localhost
