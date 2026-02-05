

# Guía Completa: Invitar Colaborador a Lovable

Esta guía detalla cómo invitar a tu colaborador directamente a Lovable para que trabaje en el mismo proyecto con acceso completo a la base de datos y el código.

---

## Información del Proyecto

| Elemento | Valor |
|----------|-------|
| **Proyecto Lovable** | Smart Learning Studio |
| **URL del Proyecto** | https://lovable.dev/projects/86f5fc8d-1fb3-46d9-a5bf-00c5399ea0f7 |
| **URL Publicada** | https://smart-learning-studio.lovable.app |
| **Repositorio GitHub** | Conectado (sincronización automática) |

---

## Opción A: Invitar Solo al Proyecto (Recomendado)

El colaborador solo verá este proyecto específico.

### Paso 1: Abrir el Diálogo de Compartir

1. Abrir el proyecto en Lovable
2. Click en el botón **Share** (esquina superior derecha, icono "+")

### Paso 2: Invitar al Colaborador

1. Ingresar el email del colaborador
2. Seleccionar el nivel de acceso:

| Rol | Permisos |
|-----|----------|
| **Viewer** | Solo puede ver el código y la preview |
| **Editor** | Puede editar el código y usar el chat con IA |
| **Admin** | Puede gestionar configuraciones, colaboradores y publicar |

3. Click en **Invite**
4. El colaborador recibirá un email con la invitación

### Paso 3: El Colaborador Acepta la Invitación

1. El colaborador recibe el email de invitación
2. Click en el enlace del email
3. Si no tiene cuenta en Lovable, deberá crearla
4. Automáticamente tendrá acceso al proyecto

---

## Opción B: Invitar al Workspace Completo

El colaborador verá TODOS los proyectos del workspace.

### Paso 1: Acceder a Configuración del Workspace

1. Ir a **Settings** (icono de engranaje)
2. Navegar a **People**

### Paso 2: Agregar Miembro

1. Click en **Add member** o **Invite**
2. Ingresar el email del colaborador
3. Seleccionar el rol:

| Rol | Permisos |
|-----|----------|
| **Viewer** | Ver todos los proyectos |
| **Editor** | Crear y editar todos los proyectos |
| **Admin** | Gestionar workspace, facturación y miembros |
| **Owner** | Control total del workspace |

4. Enviar invitación

---

## Lo Que el Colaborador Podrá Hacer

### Acceso al Código
- Ver y editar todo el código del proyecto
- Usar el chat con IA para hacer cambios
- Ver la preview en tiempo real
- Sincronización automática con GitHub

### Acceso a la Base de Datos (Cloud View)
- **Database > Tables**: Ver, crear, editar y eliminar registros
- **Database > Tables > Export**: Exportar datos en CSV/JSON
- **Users**: Ver usuarios registrados en el sistema de autenticación
- **Edge Functions**: Ver y gestionar las funciones serverless
- **Secrets**: Ver (no los valores) y gestionar secrets

### Acceso a las Edge Functions
Las 5 Edge Functions estarán disponibles:
- `generate-guia-clase`
- `generate-quiz-pre`
- `generate-quiz-post`
- `generate-recomendaciones`
- `generate-desempenos`

---

## Credenciales de Prueba Existentes

Compartir estas credenciales con el colaborador para probar la aplicación:

### Usuario Docente
```
Email: docente@gmail.com
Password: admin123
```

### Usuario Alumno
```
Email: alumno@gmail.com
Password: admin123
```

---

## Flujo de Trabajo Recomendado

```text
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE COLABORACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TÚ (Owner)              COLABORADOR (Editor/Admin)        │
│      │                          │                          │
│      │   1. Invitación email    │                          │
│      │ ───────────────────────► │                          │
│      │                          │                          │
│      │   2. Acepta invitación   │                          │
│      │ ◄─────────────────────── │                          │
│      │                          │                          │
│      │                          │                          │
│      ▼                          ▼                          │
│  ┌───────────────────────────────────────────────────┐     │
│  │              LOVABLE PROJECT                       │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │     │
│  │  │   Código    │  │  Database   │  │  Preview  │  │     │
│  │  │   (React)   │  │  (Cloud)    │  │  (Live)   │  │     │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │     │
│  └───────────────────────────────────────────────────┘     │
│                          │                                  │
│                          ▼                                  │
│  ┌───────────────────────────────────────────────────┐     │
│  │                    GITHUB                          │     │
│  │         (Sincronización automática)               │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Consideraciones Importantes

### Uso de Créditos
- Los créditos usados por el colaborador se **descuentan del workspace del owner** (tú)
- El colaborador NO usa sus propios créditos
- Cada mensaje en el chat con IA consume 1 crédito

### Base de Datos Compartida
- Ambos trabajan sobre la **misma base de datos**
- Los cambios son visibles inmediatamente para ambos
- No hay conflictos de datos - es un entorno único

### Código y GitHub
- Los cambios de código se sincronizan automáticamente con GitHub
- Ambos pueden hacer commits desde Lovable
- Si editan desde GitHub, los cambios aparecen en Lovable

### Edge Functions
- Los cambios en Edge Functions se despliegan automáticamente
- El secret `LOVABLE_API_KEY` ya está configurado
- No necesitan configuración adicional

---

## Comparativa: Lovable vs Supabase Externo

| Aspecto | Invitar a Lovable | Supabase Externo |
|---------|-------------------|------------------|
| **Setup** | 2 minutos | 30-60 minutos |
| **Base de datos** | Compartida | Independiente |
| **Edge Functions** | Automáticas | Configuración manual |
| **Secrets** | Ya configurados | Configurar manualmente |
| **Créditos IA** | Del workspace | Su propia API key |
| **Colaboración** | Tiempo real | Via Git |
| **Ideal para** | Trabajo conjunto | Desarrollo independiente |

---

## Checklist para el Colaborador

Una vez invitado, el colaborador debe:

- [ ] Aceptar la invitación por email
- [ ] Crear cuenta en Lovable (si no tiene)
- [ ] Acceder al proyecto Smart Learning Studio
- [ ] Probar login con credenciales de prueba
- [ ] Familiarizarse con Cloud View (Database, Edge Functions)
- [ ] Hacer un cambio de prueba para verificar permisos

---

## Próximos Pasos

1. **Invitar**: Usa el botón Share y envía la invitación
2. **Compartir credenciales**: Envía las credenciales de prueba
3. **Compartir esta guía**: Para que el colaborador entienda el setup
4. **Definir responsabilidades**: Qué partes del proyecto trabajará cada uno

