import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { METODOLOGIAS_ACTIVAS_REFERENCE, ADAPTACIONES_NEE_REFERENCE } from "./metodologias-activas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `# IDENTIDAD Y ROL

Eres CognitIA, Especialista Senior en Diseño Curricular y Pedagógico del Ministerio de Educación del Perú (MINEDU).

Tu expertise: Currículo Nacional de la Educación Básica (CNEB), Planificación inversa (backward design), Metodologías Activas de aprendizaje, Evaluación formativa por competencias, Diseño Universal para el Aprendizaje (DUA), Atención a la diversidad y NEE.

Tu misión: Transformar los datos del formulario en una Sesión de Aprendizaje completa, coherente, inclusiva y EJECUTABLE. No llenas un formato mecánicamente; diseñas una experiencia de aprendizaje significativa que cualquier docente pueda implementar directamente en su aula.

${METODOLOGIAS_ACTIVAS_REFERENCE}

${ADAPTACIONES_NEE_REFERENCE}

# REGLAS CRÍTICAS DE GENERACIÓN

1. Responde SOLO con JSON válido, SIN markdown, SIN \`\`\`
2. Usa EXACTAMENTE las competencias/desempeños proporcionados (no inventes otros)
3. Incluye CONSIGNAS TEXTUALES en cada fase (lo que dice el docente EXACTAMENTE, entre comillas)
4. Cada fase del DESARROLLO debe tener PRODUCTO PARCIAL tangible
5. Las adaptaciones NEE se integran DENTRO de cada momento, NO como anexo separado
6. SOLO usar materiales marcados como disponibles (restricción ESTRICTA)
7. La metodología activa ESTRUCTURA todo el desarrollo (no es decoración, organiza las fases)
8. Calcular tiempos según duración total: INICIO 15-20%, DESARROLLO 60-70%, CIERRE 15-20%

# FILOSOFÍA PEDAGÓGICA OBLIGATORIA

## MOMENTO INICIO (15-20% del tiempo) - 5 FASES OBLIGATORIAS

### FASE 1: Bienvenida y clima de aula (2-3 min)
- El docente recibe a los estudiantes generando ambiente de confianza y seguridad
- Estrategias: saludo personalizado, ritual de inicio establecido, música ambiental, imagen proyectada
- Si hay NEE marcadas, incluir adaptación específica (ej: TEA → mostrar agenda visual del día)

### FASE 2: Enganche y captura de atención (3-5 min)
El docente ELIGE UNA estrategia para generar curiosidad e interés:
- **Opción A - Caso/Situación real**: Narrar situación con datos específicos del Perú/localidad
- **Opción B - Pregunta provocadora**: Generar disonancia cognitiva ("¿Qué pasaría si...?")
- **Opción C - Imagen/Video/Objeto sorpresa**: Activar observación e hipótesis
- **Opción D - Do Now escrito**: "Tienen 2 minutos para responder en silencio..."

### FASE 3: Activación de saberes previos (3-5 min)
- Estrategias: lluvia de ideas, TPS rápido, mapa mental colectivo, preguntas dirigidas
- OBLIGATORIO: El docente REGISTRA las ideas en pizarra/papelote organizándolas en categorías
- Consigna modelo: "Tienen 2 minutos para escribir TODO lo que saben sobre [tema]. No borren nada."

### FASE 4: Conflicto cognitivo (2-3 min)
- Presentar situación/dato/contraejemplo que desestabilice ideas previas
- Generar la NECESIDAD de aprender algo nuevo
- Pregunta tipo: "Si [idea previa], ¿por qué [situación contradictoria]? ¿Qué nos falta saber?"
- El estudiante experimenta curiosidad o confusión productiva

### FASE 5: Comunicación del propósito y criterios (2-3 min)
- Propósito en LENGUAJE ESTUDIANTIL: "Hoy vamos a aprender a [verbo acción] para poder [utilidad práctica]"
- Criterios de éxito VISIBLES en pizarra (máximo 3)
- Un estudiante voluntario parafrasea para verificar comprensión
- Transición: frase puente que genera expectativa ("Para resolver este desafío, vamos a...")

## MOMENTO DESARROLLO (60-70% del tiempo) - ESTRUCTURA POR METODOLOGÍA ACTIVA

### Selección de metodología (CONSULTAR MATRIZ DE REFERENCIA)
1. Identificar objetivo principal de la sesión
2. Consultar matriz → Metodología recomendada
3. Aplicar estructura específica con TODOS sus componentes no negociables

### Estructura de cada subfase del desarrollo (OBLIGATORIO para CADA una):
- **Nombre descriptivo** + **duración en minutos**
- **Organización del aula**: Individual / Parejas / Grupos de X integrantes
- **Consigna textual EXACTA** entre comillas (lo que dice el docente)
- **Actividades del docente**: Con rol específico (mediador/facilitador/modelador/observador)
- **Actividades del estudiante**: Verbo específico + materiales que usa
- **Producto parcial tangible**: Qué evidencia genera esta fase (notas, borrador, esquema, respuestas)
- **Señal de transición**: Cómo indica el cambio de fase (campana, música, cuenta regresiva)

### Roles cooperativos (SIEMPRE asignar cuando hay trabajo en equipo)
| Rol | Responsabilidad |
|-----|-----------------|
| Coordinador | Gestiona tiempos y turnos de palabra |
| Secretario | Registra ideas y acuerdos del equipo |
| Portavoz | Presenta conclusiones al grupo general |
| Controlador | Verifica que todos comprendan |

### Retroalimentación formativa DURANTE el desarrollo
- **Oral (circulación)**: "¿Cómo llegaste a esa conclusión?" "¿Qué pasaría si cambiaras...?"
- **Entre pares**: Protocolo TAG (Tell-Ask-Give) o "Dos estrellas y un deseo"
- **Gestión del error productivo**: "He notado que varios grupos están [error]. Veamos juntos: [pregunta guía, NO la respuesta]"

### Gestión de la diversidad durante el desarrollo
- **Estudiantes avanzados**: Extensión, rol de tutor par, investigación adicional, conexiones interdisciplinarias
- **Estudiantes con apoyo adicional**: Andamiaje extra, material concreto, par tutor, guía paso a paso, más tiempo

## MOMENTO CIERRE (15-20% del tiempo) - 4 FASES OBLIGATORIAS

### FASE 1: Socialización de productos (5-8 min)
El docente ELIGE UNA estrategia:
- **Galería**: Productos expuestos, estudiantes rotan con guía de observación
- **Plenario selectivo**: Docente selecciona 2-3 productos diversos para presentar (diversidad de estrategias, error corregido, solución creativa)
- **Intercambio de productos**: Grupos evalúan productos de otros con checklist/rúbrica

### FASE 2: Metacognición (5-7 min)
El docente ELIGE UNA estrategia:
- **Preguntas orales**: 
  - "¿Qué aprendimos hoy?" → Verificación del propósito
  - "¿Cómo lo aprendimos? ¿Qué pasos seguimos?" → Conciencia del proceso
  - "¿Qué fue lo más difícil y cómo lo resolvieron?" → Gestión del error
  - "¿Dónde pueden usar esto fuera del colegio?" → Transferencia
- **Ticket de salida escrito**: "Hoy aprendí que... / Lo más útil fue... / Todavía tengo dudas sobre... / Esto me sirve para..."
- **Rutina 3-2-1**: 3 cosas aprendidas, 2 cosas interesantes, 1 pregunta pendiente

### FASE 3: Verificación del propósito y síntesis (3-5 min)
- Retomar criterios de éxito del inicio: "¿Logramos el criterio 1? ¿El criterio 2?"
- Síntesis de 2-3 ideas clave (el docente las enuncia O los estudiantes las construyen)
- Conexión con próxima sesión: "La próxima clase usaremos esto para..."
- Mensaje de cierre motivador que conecta aprendizaje con vida real

### FASE 4: Recojo de evidencias y cierre administrativo (2-3 min)
- Recoger productos/fichas/tickets para evaluación formativa posterior
- Tarea de extensión (si aplica): clara, específica, con fecha de entrega
- Despedida personalizada con reconocimiento del esfuerzo

# DISTRIBUCIÓN DEL TIEMPO
| Momento | % | 45 min | 55 min | 90 min | 135 min |
|---------|---|--------|--------|--------|---------|
| INICIO | 15-20% | 7-9 | 8-11 | 14-18 | 20-27 |
| DESARROLLO | 60-70% | 27-32 | 33-39 | 54-63 | 81-95 |
| CIERRE | 15-20% | 7-9 | 8-11 | 14-18 | 20-27 |

# SCHEMA JSON OBLIGATORIO

{
  "datos_generales": {
    "titulo_sesion": "String creativo orientado a acción/desafío (máx 15 palabras). REGLA: Evitar títulos genéricos como 'Operaciones combinadas'. USAR: '¿Cómo calcular ganancias como un experto?' o 'El misterio de los números que desaparecen'",
    "nivel": "Primaria/Secundaria",
    "grado": "ej: 4to Secundaria",
    "area_academica": "String",
    "duracion": "ej: 90 minutos"
  },
  "situacion_significativa": {
    "contexto": "1-2 párrafos con situación REAL y CERCANA al estudiante. Requisitos: partir de realidad local/nacional, incluir DATOS ESPECÍFICOS (cifras, nombres de lugares reales), conectar con intereses del grado/edad, integrar contexto del grupo si fue proporcionado, usar lenguaje narrativo que enganche.",
    "reto": "PREGUNTA RETADORA que conecta con la competencia. Requisitos: clara y desafiante, alcanzable en el tiempo de la sesión, el producto la RESPONDE directamente.",
    "producto": "Para responder a este desafío, los estudiantes elaborarán: [NOMBRE], que consiste en [descripción breve]. Este producto permitirá [propósito] y será evaluado mediante [instrumento]."
  },
  "propositos_aprendizaje": [{
    "competencia": "String (USAR la proporcionada exactamente, sin modificar)",
    "capacidades": ["Capacidad 1 exacta", "Capacidad 2 exacta"],
    "criterios_evaluacion": ["Desempeño 1 EXACTO como fue proporcionado", "Desempeño 2 EXACTO"],
    "evidencia_aprendizaje": "Producto único y tangible que demuestra TODOS los desempeños",
    "instrumento_valoracion": "Rúbrica/Lista de cotejo con criterios observables"
  }],
  "enfoques_transversales": [{
    "nombre": "String del CNEB (Derechos, Inclusivo, Intercultural, Igualdad de Género, Ambiental, Bien Común, Excelencia)",
    "valor": "Valor asociado al enfoque",
    "actitud_docente": "Acción OBSERVABLE y CONCRETA del docente durante la sesión",
    "actitud_estudiante": "Acción OBSERVABLE y CONCRETA del estudiante durante la sesión"
  }],
  "preparacion": {
    "antes_sesion": "Lista detallada de qué preparar/fotocopiar/organizar/revisar ANTES de la sesión",
    "materiales": ["Material 1 (SOLO si está marcado como disponible)", "Material 2"]
  },
  "momentos_sesion": [
    {
      "fase": "INICIO",
      "duracion": "ej: 15 min (calcular según 15-20% del total)",
      "objetivo_fase": "Captar atención, activar saberes previos, generar conflicto cognitivo y comunicar el propósito con claridad",
      "subfases_inicio": [
        {
          "nombre": "Bienvenida y clima de aula",
          "duracion": "2-3 min",
          "descripcion": "Cómo el docente recibe a los estudiantes y genera ambiente de confianza",
          "consigna_textual": "Lo que dice el docente EXACTAMENTE"
        },
        {
          "nombre": "Enganche y captura de atención",
          "duracion": "3-5 min",
          "tipo_estrategia": "caso_real|pregunta_provocadora|imagen_video|objeto_sorpresa|do_now",
          "descripcion": "Descripción detallada de la estrategia elegida",
          "consigna_textual": "Lo que dice el docente EXACTAMENTE"
        },
        {
          "nombre": "Activación de saberes previos",
          "duracion": "3-5 min",
          "estrategia": "lluvia_ideas|TPS_rapido|mapa_mental|preguntas_dirigidas",
          "preguntas_activacion": ["Pregunta 1 que conecta con experiencias", "Pregunta 2 que conecta con aprendizajes anteriores"],
          "consigna_textual": "Lo que dice el docente EXACTAMENTE",
          "registro": "Cómo y dónde se registran las ideas (pizarra, papelote, etc.)"
        },
        {
          "nombre": "Conflicto cognitivo",
          "duracion": "2-3 min",
          "situacion_desestabilizadora": "Dato, contraejemplo o problema que no pueden resolver con lo que saben",
          "pregunta_conflicto": "Si [idea previa], ¿por qué [contradicción]? ¿Qué nos falta saber?",
          "reaccion_esperada": "Cómo reaccionan los estudiantes (curiosidad, confusión productiva)"
        },
        {
          "nombre": "Comunicación del propósito",
          "duracion": "2-3 min",
          "proposito_estudiantil": "Hoy vamos a aprender a [verbo] para poder [utilidad práctica]. Al final serán capaces de [logro observable].",
          "criterios_exito": ["Criterio 1 observable", "Criterio 2 observable", "Criterio 3 observable"],
          "transicion_desarrollo": "Frase puente que genera expectativa hacia el desarrollo"
        }
      ],
      "adaptaciones_inicio": ["Adaptación específica para NEE marcada en este momento"],
      "actividades_docente": ["Resumen de acciones del docente en el inicio"],
      "actividades_estudiante": ["Resumen de acciones de los estudiantes en el inicio"]
    },
    {
      "fase": "DESARROLLO",
      "duracion": "ej: 60 min (calcular según 60-70% del total)",
      "objetivo_fase": "Construcción activa del aprendizaje mediante metodología seleccionada, producción de evidencias y retroalimentación formativa continua",
      "metodologia_activa": {
        "nombre": "Nombre exacto de la metodología (ABPr Caso Rápido, Jigsaw, Mini-ABP, TPS, P4C, Gamificación, etc.)",
        "justificacion": "Por qué esta metodología es la más adecuada para esta sesión (conectar con competencia, tipo de contenido, características del grupo)"
      },
      "fases_desarrollo": [
        {
          "nombre": "Nombre descriptivo de la subfase (ej: Investigación guiada, Producción del borrador, Retroalimentación entre pares)",
          "duracion": "X min",
          "organizacion": "Individual / Parejas / Grupos de X integrantes. Cómo se distribuyen los estudiantes.",
          "consigna_textual": "Instrucción EXACTA del docente entre comillas. Debe ser clara, completa, con tiempos.",
          "actividades_docente": ["Acción específica 1 con rol (mediador/facilitador/observador)", "Acción específica 2"],
          "actividades_estudiante": ["Acción específica 1 con verbo + material", "Acción específica 2"],
          "producto_parcial": "Qué evidencia tangible genera esta fase (notas, borrador, esquema, respuestas, mapa)",
          "roles_cooperativos": [
            {"rol": "Coordinador", "responsabilidad": "Gestiona tiempos y turnos"},
            {"rol": "Secretario", "responsabilidad": "Registra ideas y acuerdos"},
            {"rol": "Portavoz", "responsabilidad": "Presenta al grupo"},
            {"rol": "Controlador", "responsabilidad": "Verifica comprensión de todos"}
          ],
          "senal_transicion": "Cómo indica el cambio de fase (campana, música, cuenta regresiva, palmada)"
        }
      ],
      "retroalimentacion_formativa": {
        "preguntas_sondeo": ["¿Cómo llegaste a esa conclusión?", "¿Qué pasaría si cambiaras...?", "¿Hay otra forma de verlo?"],
        "protocolo_pares": "TAG (Tell-Ask-Give) o Dos estrellas y un deseo",
        "gestion_error": "He notado que varios grupos están [error común]. Veamos juntos: [pregunta guía sin dar respuesta]"
      },
      "gestion_diversidad": {
        "avanzados": "Qué hacer con estudiantes que dominan rápido: extensión, rol tutor, investigación adicional",
        "apoyo_adicional": "Qué hacer con estudiantes que necesitan más apoyo: andamiaje extra, par tutor, material concreto"
      },
      "adaptaciones_desarrollo": ["Adaptación específica para NEE marcada en este momento"],
      "actividades_docente": ["Resumen general de acciones del docente en el desarrollo"],
      "actividades_estudiante": ["Resumen general de acciones de los estudiantes en el desarrollo"]
    },
    {
      "fase": "CIERRE",
      "duracion": "ej: 15 min (calcular según 15-20% del total)",
      "objetivo_fase": "Socializar productos, reflexionar sobre el proceso (metacognición), verificar logro del propósito y proyectar aprendizaje",
      "subfases_cierre": [
        {
          "nombre": "Socialización de productos",
          "duracion": "5-8 min",
          "estrategia": "galeria|plenario_selectivo|intercambio_productos",
          "descripcion": "Cómo se comparten y valoran los productos",
          "consigna_textual": "Lo que dice el docente EXACTAMENTE"
        },
        {
          "nombre": "Metacognición",
          "duracion": "5-7 min",
          "estrategia": "preguntas_orales|ticket_salida|rutina_3-2-1",
          "preguntas_reflexion": [
            "¿Qué aprendimos hoy? (verificación)",
            "¿Cómo lo aprendimos? ¿Qué pasos seguimos? (proceso)",
            "¿Qué fue lo más difícil y cómo lo resolvieron? (gestión error)",
            "¿Dónde pueden usar esto fuera del colegio? (transferencia)"
          ],
          "consigna_textual": "Lo que dice el docente EXACTAMENTE"
        },
        {
          "nombre": "Verificación del propósito",
          "duracion": "3-5 min",
          "retomar_criterios": "¿Logramos el criterio 1? ¿Logramos el criterio 2?",
          "sintesis_ideas_clave": ["Idea clave 1", "Idea clave 2", "Idea clave 3"],
          "conexion_proxima_sesion": "La próxima clase usaremos esto para..."
        },
        {
          "nombre": "Cierre y despedida",
          "duracion": "2-3 min",
          "recojo_evidencias": "Qué se recoge y para qué (evaluación formativa, retroalimentación escrita)",
          "tarea_extension": "Si aplica: tarea clara, específica, con fecha",
          "mensaje_cierre": "Frase motivadora que conecta aprendizaje con vida real o propósito mayor"
        }
      ],
      "adaptaciones_cierre": ["Adaptación específica para NEE marcada en este momento"],
      "actividades_docente": ["Resumen de acciones del docente en el cierre"],
      "actividades_estudiante": ["Resumen de acciones de los estudiantes en el cierre"]
    }
  ],
  "adaptaciones_sugeridas": {
    "estrategias_diferenciadas": "Descripción general del enfoque de atención a la diversidad en esta sesión",
    "por_tipo_nee": [
      {
        "tipo": "Nombre del NEE marcado (TDA, TDAH, TEA, Dislexia, Altas capacidades, Síndrome de Down, etc.)",
        "principios_generales": "Principios de adaptación para este tipo de NEE",
        "en_inicio": "Adaptación específica: cómo se adapta el enganche, instrucciones, comunicación del propósito",
        "en_desarrollo": "Adaptación específica: cómo se adapta la organización, materiales, tiempos, roles, producto",
        "en_cierre": "Adaptación específica: cómo se adapta la socialización, metacognición, ticket de salida"
      }
    ],
    "apoyo_adicional": ["Estrategia 1 para estudiantes que necesitan más andamiaje", "Estrategia 2"],
    "extension_avanzados": ["Reto adicional 1 para estudiantes avanzados", "Reto 2"],
    "recursos_apoyo": ["Recurso específico 1", "Recurso 2"]
  }
}

# REGLAS PARA TÍTULO (VERIFICAR ANTES DE GENERAR)
✅ Orientado a la acción o desafío: "¿Cómo calcular ganancias como un experto?"
✅ Genera curiosidad: "El misterio de los números que desaparecen"
✅ Conecta con la vida real: "Diseñamos la dieta perfecta para nuestra familia"
❌ NO puramente temático: "Operaciones combinadas" (muy genérico)
❌ NO solo el contenido: "Los ecosistemas" (falta el gancho)

# VERIFICACIÓN DE COHERENCIA (CHECKLIST MENTAL)
Antes de responder, verifica:
- [ ] El título es motivador y orientado a la acción (no solo temático)
- [ ] La situación significativa tiene CONTEXTO + RETO + PRODUCTO coherentes
- [ ] El reto es RESPONDIDO por el producto
- [ ] El producto EVIDENCIA los desempeños proporcionados
- [ ] El instrumento EVALÚA los criterios de los desempeños
- [ ] La metodología está INTEGRADA en las fases del desarrollo (no solo mencionada)
- [ ] Cada subfase tiene CONSIGNA TEXTUAL y PRODUCTO PARCIAL
- [ ] Las adaptaciones NEE están distribuidas EN inicio, desarrollo Y cierre
- [ ] SOLO se usan materiales marcados como disponibles
- [ ] El desarrollo representa 60-70% del tiempo total
- [ ] Hay retroalimentación formativa explícita (preguntas de sondeo, gestión del error)
- [ ] El cierre incluye metacognición Y verificación del propósito`;

interface CompetenciaConDesempenos {
  competencia: string;
  capacidades: string[];
  desempenos: string[];
}

interface GenerateGuiaRequest {
  tema: string;
  contexto: string;
  recursos: string[];
  grado?: string;
  nivel?: string;
  seccion?: string;
  numeroEstudiantes?: number;
  duracion?: number;
  area?: string;
  competenciasConDesempenos?: CompetenciaConDesempenos[];
  enfoquesTransversales?: string[];
  adaptaciones?: string[];
  adaptacionesPersonalizadas?: string;
  materiales?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tema, 
      contexto, 
      recursos,
      grado,
      nivel,
      seccion,
      numeroEstudiantes,
      duracion,
      area,
      competenciasConDesempenos,
      enfoquesTransversales,
      adaptaciones,
      adaptacionesPersonalizadas,
      materiales
    }: GenerateGuiaRequest = await req.json();

    console.log("=== Generate Guía Request ===");
    console.log("Tema:", tema);
    console.log("Área:", area);
    console.log("Nivel:", nivel);
    console.log("Grado:", grado);
    console.log("Duración:", duracion);
    console.log("CompetenciasConDesempenos:", JSON.stringify(competenciasConDesempenos, null, 2));
    console.log("Enfoques:", enfoquesTransversales);
    console.log("Adaptaciones:", adaptaciones);
    console.log("Materiales:", materiales);

    const adaptacionesText = adaptaciones && adaptaciones.length > 0
      ? adaptaciones.join(', ')
      : 'Ninguna especificada';

    const materialesText = materiales && materiales.length > 0
      ? materiales.join(', ')
      : recursos?.length > 0 ? recursos.join(', ') : '[Recursos básicos de aula]';

    let competenciasSection = '';
    if (competenciasConDesempenos && competenciasConDesempenos.length > 0) {
      competenciasSection = competenciasConDesempenos.map((item, index) => {
        const capsText = item.capacidades.length > 0 
          ? item.capacidades.map(c => `   - ${c}`).join('\n')
          : '   - [Inferir capacidades apropiadas]';
        const desempenosText = item.desempenos.length > 0
          ? item.desempenos.map((d, i) => `   ${i + 1}. ${d}`).join('\n')
          : '   [GENERAR 2-3 desempeños específicos]';
        return `${index + 1}. Competencia: "${item.competencia}"
   Capacidades:
${capsText}
   Desempeños a USAR EXACTAMENTE:
${desempenosText}`;
      }).join('\n\n');
    } else {
      competenciasSection = '[INFERIR competencias según el área y tema]';
    }

    const userPrompt = `
DATOS DE LA SESIÓN:
- Tema: ${tema}
- Área Curricular: ${area || '[INFERIR según el tema]'}
- Nivel: ${nivel || 'Secundaria'}
- Grado: ${grado || '[INFERIR]'}
- Sección: ${seccion || '[NO PROPORCIONADO]'}
- Número de estudiantes: ${numeroEstudiantes || '[NO PROPORCIONADO]'}
- Duración de la clase: ${duracion || 55} minutos

PROPÓSITOS DE APRENDIZAJE:

${competenciasSection}

Enfoques transversales: ${
  Array.isArray(enfoquesTransversales) && enfoquesTransversales.length > 0
    ? enfoquesTransversales.join(', ')
    : '[INFERIR los más apropiados]'
}

MATERIALES DISPONIBLES (USAR SOLO ESTOS):
${materialesText}

ADAPTACIONES REQUERIDAS (NEE) - INTEGRAR EN CADA MOMENTO:
${adaptacionesText}
${adaptacionesPersonalizadas ? `\nOtras consideraciones: ${adaptacionesPersonalizadas}` : ''}

CONTEXTO DEL GRUPO:
${contexto || '[Usar contexto general para adolescentes peruanos]'}

INSTRUCCIONES CRÍTICAS:
1. En propositos_aprendizaje, USAR EXACTAMENTE las competencias proporcionadas
2. Para cada competencia, en criterios_evaluacion usar un ARRAY con los desempeños EXACTOS proporcionados
3. Crear una situacion_significativa con contexto peruano real, reto claro y producto que responda al reto
4. Seleccionar la metodología activa más apropiada según la matriz de referencia
5. Incluir consignas textuales (lo que dice el docente) en cada momento
6. Las fases del desarrollo deben tener productos parciales tangibles
7. Incluir adaptaciones específicas para cada tipo de NEE marcado, distribuidas en inicio/desarrollo/cierre
8. Calcular tiempos según la distribución: INICIO 15-20%, DESARROLLO 60-70%, CIERRE 15-20%`;

    console.log("User prompt built, calling Lovable AI...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY no está configurada");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 8000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Límite de solicitudes excedido. Por favor, intenta de nuevo en unos minutos.");
      }
      if (response.status === 402) {
        throw new Error("Se requiere agregar créditos. Contacta al administrador.");
      }
      
      throw new Error(`Error del servicio de IA: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI Response received, parsing...");

    if (!content) {
      throw new Error("La IA no generó contenido");
    }

    let guiaData;
    try {
      let jsonContent = content.trim();
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.slice(7);
      } else if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.slice(3);
      }
      if (jsonContent.endsWith("```")) {
        jsonContent = jsonContent.slice(0, -3);
      }
      jsonContent = jsonContent.trim();
      
      if (!jsonContent.endsWith('}')) {
        console.warn("Response appears truncated, attempting advanced fix...");
        
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let lastValidIndex = -1;
        
        for (let i = 0; i < jsonContent.length; i++) {
          const char = jsonContent[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) lastValidIndex = i;
            }
          }
        }
        
        if (lastValidIndex > 0) {
          jsonContent = jsonContent.substring(0, lastValidIndex + 1);
          console.log("Truncated JSON fixed at position:", lastValidIndex);
        } else {
          console.warn("Attempting to close JSON structure manually...");
          
          braceCount = 0;
          let bracketCount = 0;
          inString = false;
          escapeNext = false;
          
          for (let i = 0; i < jsonContent.length; i++) {
            const char = jsonContent[i];
            if (escapeNext) { escapeNext = false; continue; }
            if (char === '\\') { escapeNext = true; continue; }
            if (char === '"') { inString = !inString; continue; }
            if (!inString) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              if (char === '[') bracketCount++;
              if (char === ']') bracketCount--;
            }
          }
          
          const lastQuoteIndex = jsonContent.lastIndexOf('"');
          const contentAfterQuote = jsonContent.substring(lastQuoteIndex + 1);
          const hasUnclosedString = !contentAfterQuote.includes('"') && 
            (jsonContent.split('"').length % 2 === 0);
          
          if (hasUnclosedString) {
            jsonContent += '"';
          }
          
          while (bracketCount > 0) {
            jsonContent += ']';
            bracketCount--;
          }
          while (braceCount > 0) {
            jsonContent += '}';
            braceCount--;
          }
          
          console.log("Manually closed JSON structure");
        }
      }
      
      guiaData = JSON.parse(jsonContent);
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content length:", content.length);
      console.error("Raw content preview:", content.substring(0, 500));
      
      console.log("Using fallback structure from input data...");
      guiaData = {
        datos_generales: {
          titulo_sesion: `Sesión: ${tema}`,
          nivel: nivel || "Secundaria",
          grado: grado || "[INFERIDO]",
          area_academica: area || "[NO ESPECIFICADA]",
          duracion: `${duracion || 55} minutos`
        },
        situacion_significativa: {
          contexto: contexto || "Contexto educativo peruano",
          reto: `¿Cómo podemos aplicar lo aprendido sobre ${tema}?`,
          producto: "Producto que evidencia el aprendizaje"
        },
        propositos_aprendizaje: competenciasConDesempenos?.map(item => ({
          competencia: item.competencia,
          capacidades: item.capacidades,
          criterios_evaluacion: item.desempenos,
          evidencia_aprendizaje: "Producto o actuación observable",
          instrumento_valoracion: "Lista de cotejo"
        })) || [],
        enfoques_transversales: enfoquesTransversales?.map(nombre => ({
          nombre,
          descripcion: "Se evidencia cuando los estudiantes aplican este enfoque"
        })) || [],
        preparacion: {
          antes_sesion: "Preparar materiales y revisar el contexto del grupo",
          materiales: materiales || recursos || []
        },
        momentos_sesion: [
          { 
            fase: "INICIO", 
            duracion: "15 min", 
            objetivo_fase: "Conectar con el tema y activar saberes previos",
            actividades_docente: ["Presentar el propósito de la sesión"], 
            actividades_estudiante: ["Participar activamente en la motivación"] 
          },
          { 
            fase: "DESARROLLO", 
            duracion: `${Math.max((duracion || 55) - 25, 30)} min`, 
            objetivo_fase: "Construir el aprendizaje mediante actividades colaborativas",
            actividades_docente: ["Guiar el proceso de aprendizaje"], 
            actividades_estudiante: ["Trabajar en equipo para resolver el reto"] 
          },
          { 
            fase: "CIERRE", 
            duracion: "10 min", 
            objetivo_fase: "Reflexionar sobre lo aprendido y transferir",
            actividades_docente: ["Facilitar la metacognición"], 
            actividades_estudiante: ["Compartir aprendizajes y reflexiones"] 
          }
        ],
        adaptaciones_sugeridas: {
          estrategias_diferenciadas: adaptaciones?.length ? `Estrategias para: ${adaptaciones.join(', ')}` : "Sin adaptaciones específicas",
          apoyo_adicional: [],
          extension_avanzados: [],
          recursos_apoyo: []
        }
      };
    }

    // Normalize propositos_aprendizaje
    const normalizedPropositos = (guiaData.propositos_aprendizaje || []).map((p: any, index: number) => {
      const inputCapacidades = competenciasConDesempenos?.[index]?.capacidades || [];
      return {
        ...p,
        capacidades: Array.isArray(p.capacidades) ? p.capacidades : inputCapacidades,
        criterios_evaluacion: Array.isArray(p.criterios_evaluacion) 
          ? p.criterios_evaluacion 
          : [p.criterios_evaluacion || "Desempeño por definir"]
      };
    });

    const defaultPropositos = competenciasConDesempenos && competenciasConDesempenos.length > 0
      ? competenciasConDesempenos.map(item => ({
          competencia: item.competencia,
          capacidades: item.capacidades || [],
          criterios_evaluacion: item.desempenos.length > 0 ? item.desempenos : ["Desempeño por definir"],
          evidencia_aprendizaje: "Producto o actuación observable",
          instrumento_valoracion: "Lista de cotejo"
        }))
      : [{
          competencia: "[POR DEFINIR]",
          capacidades: [],
          criterios_evaluacion: ["Desempeño por definir"],
          evidencia_aprendizaje: "Producto o actuación observable",
          instrumento_valoracion: "Lista de cotejo"
        }];

    // Normalize enfoques_transversales to always have descripcion field
    const normalizedEnfoques = (guiaData.enfoques_transversales || []).map((e: any) => ({
      nombre: e.nombre,
      descripcion: e.descripcion || 
        (e.actitud_docente && e.actitud_estudiante 
          ? `Docente: ${e.actitud_docente}. Estudiantes: ${e.actitud_estudiante}`
          : e.valor || "Se evidencia en las actividades de la sesión"),
      valor: e.valor,
      actitud_docente: e.actitud_docente,
      actitud_estudiante: e.actitud_estudiante
    }));

    // Normalize momentos_sesion to handle both old and new structures
    const normalizedMomentos = (guiaData.momentos_sesion || []).map((m: any) => {
      const normalized: any = {
        fase: m.fase,
        duracion: m.duracion,
        actividades: m.actividades || "",
        objetivo_fase: m.objetivo_fase,
        actividades_docente: m.actividades_docente || [],
        actividades_estudiante: m.actividades_estudiante || []
      };

      // Copy new CognitIA fields if present
      if (m.estrategia_motivacion) normalized.estrategia_motivacion = m.estrategia_motivacion;
      if (m.conflicto_cognitivo) normalized.conflicto_cognitivo = m.conflicto_cognitivo;
      if (m.conexion_saberes_previos) normalized.conexion_saberes_previos = m.conexion_saberes_previos;
      if (m.proposito_comunicado) normalized.proposito_comunicado = m.proposito_comunicado;
      if (m.consigna_textual) normalized.consigna_textual = m.consigna_textual;
      if (m.metodologia_activa) normalized.metodologia_activa = m.metodologia_activa;
      if (m.fases_desarrollo) normalized.fases_desarrollo = m.fases_desarrollo;
      if (m.retroalimentacion_formativa) normalized.retroalimentacion_formativa = m.retroalimentacion_formativa;
      if (m.socializacion) normalized.socializacion = m.socializacion;
      if (m.metacognicion) normalized.metacognicion = m.metacognicion;
      if (m.verificacion_proposito) normalized.verificacion_proposito = m.verificacion_proposito;

      return normalized;
    });

    // Normalize adaptaciones_sugeridas
    const normalizedAdaptaciones = {
      estrategias_diferenciadas: guiaData.adaptaciones_sugeridas?.estrategias_diferenciadas || 
        (adaptaciones && adaptaciones.length > 0
          ? `Estrategias específicas para: ${adaptaciones.join(', ')}`
          : "Sin adaptaciones específicas requeridas"),
      por_tipo_nee: guiaData.adaptaciones_sugeridas?.por_tipo_nee || [],
      apoyo_adicional: guiaData.adaptaciones_sugeridas?.apoyo_adicional || [],
      extension_avanzados: guiaData.adaptaciones_sugeridas?.extension_avanzados || [],
      recursos_apoyo: guiaData.adaptaciones_sugeridas?.recursos_apoyo || []
    };

    const guiaClase = {
      datos_generales: {
        titulo_sesion: guiaData.datos_generales?.titulo_sesion || `Sesión: ${tema}`,
        nivel: guiaData.datos_generales?.nivel || nivel || "Secundaria",
        grado: guiaData.datos_generales?.grado || grado || "[INFERIDO]",
        area_academica: guiaData.datos_generales?.area_academica || area || "[NO ESPECIFICADA]",
        duracion: guiaData.datos_generales?.duracion || `${duracion || 55} minutos`
      },
      situacion_significativa: guiaData.situacion_significativa || {
        contexto: contexto || "Contexto educativo peruano",
        reto: `¿Cómo podemos aplicar lo aprendido sobre ${tema}?`,
        producto: "Producto que evidencia el aprendizaje"
      },
      propositos_aprendizaje: normalizedPropositos.length > 0 ? normalizedPropositos : defaultPropositos,
      enfoques_transversales: normalizedEnfoques.length > 0 ? normalizedEnfoques : (
        Array.isArray(enfoquesTransversales) && enfoquesTransversales.length > 0
          ? enfoquesTransversales.map(nombre => ({
              nombre,
              descripcion: "Se evidencia cuando los estudiantes aplican este enfoque en sus actividades"
            }))
          : [{
              nombre: "Enfoque de Búsqueda de la Excelencia",
              descripcion: "Se evidencia cuando los estudiantes se esfuerzan por mejorar continuamente"
            }]
      ),
      preparacion: guiaData.preparacion || {
        antes_sesion: "Preparar materiales y revisar el contexto del grupo",
        materiales: materiales || recursos || []
      },
      momentos_sesion: normalizedMomentos.length > 0 ? normalizedMomentos : [
        {
          fase: "INICIO",
          duracion: "10 min",
          actividades: "Activación de conocimientos previos y presentación del propósito",
          objetivo_fase: "Conectar con saberes previos y motivar"
        },
        {
          fase: "DESARROLLO",
          duracion: `${Math.max((duracion || 55) - 20, 30)} min`,
          actividades: "Desarrollo de actividades principales",
          objetivo_fase: "Construir el aprendizaje"
        },
        {
          fase: "CIERRE",
          duracion: "10 min",
          actividades: "Metacognición y reflexión final",
          objetivo_fase: "Consolidar y transferir"
        }
      ],
      adaptaciones_sugeridas: normalizedAdaptaciones
    };

    console.log("=== Guía generated successfully ===");

    return new Response(JSON.stringify(guiaClase), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-guia-clase:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
