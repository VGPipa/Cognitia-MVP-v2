/**
 * DOCUMENTO DE REFERENCIA: METODOLOGÍAS ACTIVAS
 * Versión compactada (~1500 tokens) para uso del System Prompt
 * 
 * Basado en el documento "Metodologías Activas" de CognitIA v3.0
 */

export const METODOLOGIAS_ACTIVAS_REFERENCE = `
# REFERENCIA DE METODOLOGÍAS ACTIVAS

## MATRIZ DE SELECCIÓN RÁPIDA

| Objetivo de la sesión | Metodología recomendada | Estructura clave |
|----------------------|------------------------|------------------|
| Resolver problema real contextualizado | ABPr (Caso Rápido) | 7 pasos: Situación → Pregunta → Hipótesis → Necesidades → Investigación → Solución → Reflexión |
| Crear producto tangible con impacto | ABP | Pregunta guía + Iteración + Producto público |
| Comprensión profunda de textos | Jigsaw + TPS | Expertos → Grupos base → Síntesis |
| Desarrollar argumentación crítica | P4C + Debate | Pregunta filosófica → Reglas → Comunidad de indagación |
| Práctica y consolidación | Gamificación | Quiz-battle / Escape room / Estaciones |
| Reflexión y autorregulación | SRL | Do Now → Pausas metacognitivas → Exit tickets |
| Desarrollo socioemocional | SEL | Integrado a proyectos/debates |

## 1. ABP - APRENDIZAJE BASADO EN PROYECTOS

**Cuándo usar**: Sesiones largas (2+ horas) o unidades multi-sesión donde el producto final tiene audiencia real.

**Elementos esenciales**:
- Pregunta guía desafiante y abierta
- Voz y elección del estudiante
- Investigación sostenida con iteración
- Producto público para audiencia real
- Reflexión continua

**Estructura Mini-ABP (90-135 min)**:
1. INICIO (15 min): Presentar reto + Formar equipos + Asignar roles
2. DESARROLLO: Investigación guiada (30 min) + Producción iterativa (45 min) + Retroalimentación entre pares (15 min)
3. CIERRE (20 min): Presentación + Metacognición

## 2. ABPr - APRENDIZAJE BASADO EN PROBLEMAS

**Cuándo usar**: Cuando existe un problema auténtico que requiere análisis y solución.

**Estructura Caso Rápido (45-60 min)**:
1. INICIO (10 min): Presentar caso problemático real con datos
2. DESARROLLO:
   - Identificar: ¿Qué sabemos? ¿Qué necesitamos saber? (5 min)
   - Investigar/Discutir en equipos (15 min)
   - Proponer soluciones fundamentadas (15 min)
3. CIERRE (10 min): Plenario + Transferencia a su contexto

**Protocolo de preguntas**:
- ¿Cuál es el problema real aquí?
- ¿Qué información necesitamos?
- ¿Qué soluciones son viables?
- ¿Cómo verificamos que funciona?

## 3. APRENDIZAJE COOPERATIVO

**Estructuras por objetivo**:

**TPS (Think-Pair-Share) - 5-10 min**:
- Think: Reflexión individual (1-2 min)
- Pair: Discusión en parejas (2-3 min)
- Share: Plenario selectivo (2-3 min)

**Jigsaw - 25-40 min**:
1. Grupos expertos: Cada grupo domina una parte (10 min)
2. Grupos base: Expertos enseñan a sus compañeros (15 min)
3. Evaluación conjunta (5-10 min)

**Roles cooperativos**:
| Rol | Responsabilidad |
|-----|----------------|
| Coordinador | Gestiona tiempos y turnos |
| Secretario | Registra ideas y acuerdos |
| Portavoz | Presenta al grupo |
| Controlador | Verifica comprensión de todos |

## 4. SRL - AUTORREGULACIÓN DEL APRENDIZAJE

**Momentos de integración**:

**INICIO - Do Now (3-5 min)**:
Tarea escrita breve que activa conocimiento previo y focaliza atención.

**DESARROLLO - Pausas metacognitivas**:
Cada 15-20 min: "¿Qué estrategia estás usando?" "¿Está funcionando?"

**CIERRE - Exit Ticket**:
- Hoy aprendí que...
- Todavía tengo dudas sobre...
- Esto me sirve para...

## 5. SEL - APRENDIZAJE SOCIOEMOCIONAL

**Integración transversal**:
- En debates: escucha activa, manejo de desacuerdos
- En proyectos: colaboración, perseverancia ante obstáculos
- En cierre: reconocimiento del esfuerzo, gratitud

## 6. P4C - FILOSOFÍA PARA NIÑOS / DIÁLOGO SOCRÁTICO

**Cuándo usar**: Desarrollar pensamiento crítico, explorar conceptos abstractos.

**Estructura básica (20-30 min)**:
1. Estímulo (texto, imagen, dilema) - 3 min
2. Generación de preguntas por estudiantes - 5 min
3. Votación de la pregunta a explorar - 2 min
4. Comunidad de indagación con reglas - 15 min
5. Síntesis de ideas - 5 min

**Reglas del diálogo**:
- Una voz a la vez
- Escuchar antes de responder
- Dar razones, no solo opiniones
- Está bien cambiar de opinión
- Construir sobre las ideas de otros

## 7. GAMIFICACIÓN

**Estructuras por tiempo**:

**Quiz-Battle (10-15 min)**:
Competencia por equipos con puntos, ideal para repaso.

**Escape Room Educativo (30-45 min)**:
4-5 retos encadenados que desbloquean el siguiente.

**Estaciones Gamificadas (40-60 min)**:
Rotación por estaciones con desafíos diferenciados y recompensas.

## CONSIGNAS TEXTUALES MODELO

**Para activar saberes previos**:
"Tienen 2 minutos para escribir todo lo que saben sobre [tema]. No borren nada, todo vale."

**Para trabajo en equipos**:
"En los próximos 15 minutos, su equipo debe [tarea específica]. El coordinador asegura que todos participen, el secretario registra, y al final el portavoz compartirá."

**Para metacognición**:
"¿Qué fue lo más difícil de esta actividad? ¿Qué estrategia usaron para resolverlo?"

**Para transferencia**:
"¿En qué situación de su vida real podrían aplicar lo que aprendimos hoy?"
`;

export const SELECTION_MATRIX = {
  "resolver_problema": {
    metodologia: "ABPr",
    estructura: "Caso Rápido",
    duracion_min: 45
  },
  "crear_producto": {
    metodologia: "ABP",
    estructura: "Mini-ABP",
    duracion_min: 90
  },
  "comprension_textos": {
    metodologia: "Jigsaw + TPS",
    estructura: "Expertos → Base → Síntesis",
    duracion_min: 40
  },
  "argumentacion": {
    metodologia: "P4C + Debate",
    estructura: "Comunidad de indagación",
    duracion_min: 30
  },
  "practica_consolidacion": {
    metodologia: "Gamificación",
    estructura: "Quiz-battle / Estaciones",
    duracion_min: 20
  },
  "reflexion": {
    metodologia: "SRL",
    estructura: "Do Now + Pausas + Exit Ticket",
    duracion_min: 10
  }
};
