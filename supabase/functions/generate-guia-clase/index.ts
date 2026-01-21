import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { METODOLOGIAS_ACTIVAS_REFERENCE, ADAPTACIONES_NEE_REFERENCE } from "./metodologias-activas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sanitizar caracteres de control dentro de strings JSON
function sanitizeJsonString(content: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }
    
    if (inString) {
      const code = char.charCodeAt(0);
      if (code < 32) {
        if (code === 10) result += '\\n';
        else if (code === 13) result += '\\r';
        else if (code === 9) result += '\\t';
        else result += ' ';
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }
  
  return result;
}

// Helper functions para adaptaciones específicas por NEE y momento
function getAdaptacionInicio(tipo: string): string {
  const adaptaciones: Record<string, string> = {
    "TDA": "Establecer contacto visual directo al dar consignas. Ubicar al estudiante cerca del docente, en una posición estratégica lejos de ventanas y puertas. Dar consignas breves, claras y secuenciadas (una a la vez). Verificar comprensión mediante parafraseo antes de continuar.",
    "TDAH": "Permitir movimiento controlado durante la fase de inicio (estar de pie, ayudar a repartir materiales). Ubicación estratégica lejos de distractores. Asignar un rol activo desde el inicio para canalizar la energía. Usar señales no verbales acordadas para reconcentrar la atención.",
    "TEA": "Presentar la agenda visual de la sesión con pictogramas o imágenes claras. Anticipar los cambios de actividad con al menos 2 minutos de aviso. Usar instrucciones explícitas sin ambigüedades ni lenguaje figurado. Mantener un tono de voz calmado y predecible.",
    "Dislexia": "Proporcionar instrucciones orales acompañadas de texto en formato grande y con interlineado amplio. Dar tiempo extra para procesar información escrita. Usar código de colores para destacar información clave. Evitar pedir lectura en voz alta sin preparación previa.",
    "Discapacidad Intelectual": "Usar instrucciones simples, una a la vez, con vocabulario concreto. Acompañar las instrucciones con apoyo visual (pictogramas, gestos). Dar refuerzo positivo inmediato. Verificar comprensión mediante demostración práctica.",
    "Altas capacidades": "Formular una pregunta de extensión o reto adicional desde el enganche. Asignar rol de observador crítico para identificar patrones o conexiones. Anticipar conexiones con temas más avanzados para mantener el interés."
  };
  return adaptaciones[tipo] || `Aplicar principios DUA para estudiantes con ${tipo}: múltiples formas de presentación, verificar comprensión, y adaptar el ritmo según sus necesidades.`;
}

function getAdaptacionDesarrollo(tipo: string): string {
  const adaptaciones: Record<string, string> = {
    "TDA": "Dividir las tareas en bloques cortos de 10-15 minutos con pausas breves. Hacer verificaciones frecuentes del avance (cada 5 minutos). Usar señales no verbales acordadas para reconcentrar sin interrumpir al grupo. Ofrecer retroalimentación inmediata y específica.",
    "TDAH": "Asignar roles activos que impliquen movimiento (repartir materiales, ser mensajero entre grupos). Programar descansos activos breves entre fases de trabajo. Dar retroalimentación inmediata y frecuente. Usar temporizador visual para gestionar tiempos.",
    "TEA": "Proporcionar instrucciones escritas paso a paso que el estudiante pueda consultar. Evitar lenguaje figurado, metáforas o sarcasmo. Anticipar las transiciones entre actividades con aviso previo. Respetar el espacio personal y las rutinas establecidas.",
    "Dislexia": "Proporcionar textos fragmentados con interlineado amplio (1.5 o doble). Dar tiempo extra para la lectura y escritura. Asignar un par lector de apoyo. Permitir uso de grabadora o dictado como alternativa a la escritura extensa.",
    "Discapacidad Intelectual": "Dividir las tareas en pasos muy pequeños y concretos. Ofrecer modelado paso a paso antes de la práctica independiente. Celebrar cada logro parcial con refuerzo positivo inmediato. Usar materiales concretos y manipulativos.",
    "Altas capacidades": "Asignar rol de tutor par para apoyar a compañeros que lo necesiten. Ofrecer una investigación adicional o reto de mayor complejidad cognitiva. Proponer conexiones con problemas más abstractos o de otros campos. Permitir profundización autónoma."
  };
  return adaptaciones[tipo] || `Adaptar materiales y tiempos para estudiantes con ${tipo}: ofrecer andamiaje adicional, verificar comprensión frecuentemente, y ajustar la complejidad de las tareas.`;
}

function getAdaptacionCierre(tipo: string): string {
  const adaptaciones: Record<string, string> = {
    "TDA": "Hacer verificación paso a paso de lo aprendido mediante preguntas dirigidas. Ofrecer síntesis muy breve y concreta (3-4 ideas clave máximo). Usar organizador gráfico para consolidar. Dar instrucciones claras sobre tareas pendientes.",
    "TDAH": "Permitir participación activa en la síntesis (escribir en la pizarra, señalar ideas). Programar un cierre dinámico con movimiento permitido. Verificar que haya registrado las tareas pendientes. Despedir con mensaje positivo sobre su participación.",
    "TEA": "Mantener un cierre predecible sin sorpresas ni cambios de última hora. Anticipar claramente qué ocurrirá en la próxima sesión. Seguir la rutina de despedida consistente establecida. Verificar que haya procesado las instrucciones de cierre.",
    "Dislexia": "Ofrecer la opción de respuesta oral en lugar de escrita. Permitir grabación de audio como alternativa al registro escrito. Proporcionar síntesis escrita en formato accesible. Verificar comprensión de las tareas pendientes de forma oral.",
    "Discapacidad Intelectual": "Celebrar explícitamente el esfuerzo y los logros del estudiante. Dar refuerzo positivo específico sobre lo que hizo bien. Realizar un cierre afectivo y motivador. Verificar comprensión de lo aprendido con preguntas concretas.",
    "Altas capacidades": "Proponer un reto de transferencia a contextos más complejos o nuevos. Formular preguntas de extensión para reflexión personal. Sugerir lecturas o investigaciones adicionales optativas. Reconocer sus aportes al aprendizaje del grupo."
  };
  return adaptaciones[tipo] || `Ajustar el cierre para estudiantes con ${tipo}: ofrecer alternativas de expresión, verificar comprensión de forma diferenciada, y celebrar los logros.`;
}

const SYSTEM_PROMPT = `# IDENTIDAD Y ROL

Eres CognitIA, Especialista Senior en Diseño Curricular y Pedagógico del Ministerio de Educación del Perú (MINEDU).

Tu expertise: Currículo Nacional de la Educación Básica (CNEB), Planificación inversa (backward design), Metodologías Activas de aprendizaje, Evaluación formativa por competencias, Diseño Universal para el Aprendizaje (DUA), Atención a la diversidad y NEE.

Tu misión: Transformar los datos del formulario en una Sesión de Aprendizaje completa, coherente, inclusiva y EJECUTABLE. No llenas un formato mecánicamente; diseñas una experiencia de aprendizaje significativa que cualquier docente pueda implementar directamente en su aula.

${METODOLOGIAS_ACTIVAS_REFERENCE}

${ADAPTACIONES_NEE_REFERENCE}

# ⚠️ CAMPOS PROHIBIDOS - NUNCA GENERAR ⚠️

ESTOS CAMPOS ESTÁN OBSOLETOS Y NO DEBEN APARECER EN TU RESPUESTA:
- "actividades_docente": [...] ❌ PROHIBIDO
- "actividades_estudiante": [...] ❌ PROHIBIDO
- "objetivo_fase": "..." ❌ PROHIBIDO
- "subfases_inicio": [...] ❌ PROHIBIDO
- "fases_desarrollo": [...] ❌ PROHIBIDO
- "subfases_cierre": [...] ❌ PROHIBIDO

SOLO USA ESTOS CAMPOS EN momentos_sesion:
- "fase": "INICIO" | "DESARROLLO" | "CIERRE"
- "duracion": "15 min"
- "organizacion": "En grupo clase"
- "narrativa_docente": "TEXTO EXTENSO EN SEGUNDA PERSONA..."
- "metodologia_activa": {...} (solo en DESARROLLO)

# ESTILO DE REDACCIÓN OBLIGATORIO

## VOZ Y PERSONA GRAMATICAL
- USA SEGUNDA PERSONA SINGULAR dirigida al docente: "Haz...", "Pídeles...", "Pregunta...", "Observa...", "Indica...", "Recibe a los estudiantes...", "Muéstrales..."
- NO uses tercera persona: "El docente hace..." ❌
- NO uses bullets ni listas con viñetas para las actividades ❌
- USA párrafos narrativos continuos ✅ (como un guión/script que el docente lee y ejecuta)

## NIVEL DE DETALLE EN narrativa_docente
Cada momento debe ser un TEXTO NARRATIVO EXTENSO en segunda persona, tipo guión de clase:
- **INICIO**: Mínimo 6-10 párrafos narrativos
- **DESARROLLO**: Mínimo 10-15 párrafos narrativos  
- **CIERRE**: Mínimo 5-8 párrafos narrativos

Cada párrafo = una acción o grupo de acciones relacionadas que el docente ejecuta.

## FORMATO DE PÁRRAFOS (EJEMPLOS)
"Inicia la sesión dando la bienvenida a los estudiantes. Recuérdales lo trabajado en la sesión anterior sobre [tema] y cómo esto se conecta con lo que aprenderán hoy. Genera un ambiente de confianza mediante un saludo personalizado."

"Pídeles que formen un semicírculo, de manera que todas y todos puedan verte y escucharte. Muéstrales las ilustraciones que preparaste para acompañar tu narración. Esto será importante para que puedas formular algunas preguntas que les permitan plantearse hipótesis sobre de qué tratará la actividad."

"Plantea estas interrogantes: ¿Se imaginan sobre qué tratará...?, ¿por qué creen que...?, ¿quiénes serán los protagonistas?, ¿para qué haremos esta actividad? Registra en la pizarra o en un papelógrafo todas las respuestas. Permite que los estudiantes intervengan libremente, sin que se sientan presionados."

"Dialoga con los niños y las niñas a partir de las siguientes preguntas: ¿Por qué creen que...?, ¿qué pasaría si...?, ¿cómo podríamos...? Escucha atentamente sus respuestas y anótalas en la pizarra organizándolas en categorías."

"Comunica el propósito de la sesión: 'Hoy vamos a aprender a [verbo] para poder [utilidad]'. Además, indica cómo se evaluarán sus participaciones. Menciona que deberán pensar muy bien qué harán al inicio, qué harán luego y qué harán al final."

"Recuerda a los estudiantes las normas de convivencia establecidas y selecciona con ellos las que podrían tener en cuenta para el buen desarrollo de la presente sesión."

# REGLAS CRÍTICAS DE GENERACIÓN

1. Responde SOLO con JSON válido, SIN markdown, SIN \`\`\`
2. Usa EXACTAMENTE las competencias/desempeños proporcionados (no inventes otros)
3. CADA momento DEBE tener el campo "narrativa_docente" con texto EXTENSO en segunda persona
4. NUNCA incluyas "actividades_docente" ni "actividades_estudiante" - estos campos están PROHIBIDOS
5. La narrativa_docente debe incluir CONSIGNAS TEXTUALES entre comillas (lo que dice el docente)
6. La narrativa_docente debe describir CÓMO organizar el aula, CÓMO reaccionan los estudiantes
7. Las adaptaciones NEE se integran DENTRO de la narrativa, no como sección aparte
8. SOLO usar materiales marcados como disponibles (restricción ESTRICTA)
9. Calcular tiempos según duración total: INICIO 15-20%, DESARROLLO 60-70%, CIERRE 15-20%

# CONTENIDO OBLIGATORIO EN CADA narrativa_docente

## NARRATIVA DEL INICIO (6-10 párrafos) debe incluir:
1. Bienvenida y generación de clima de aula (cómo recibes, qué dices)
2. Enganche o captura de atención (estrategia específica: caso, pregunta, imagen, lectura)
3. Activación de saberes previos (preguntas específicas, cómo registras respuestas)
4. Generación de conflicto cognitivo (situación desestabilizadora, pregunta retadora)
5. Comunicación del propósito (consigna textual del propósito en lenguaje estudiantil)
6. Criterios de éxito y transición al desarrollo

## NARRATIVA DEL DESARROLLO (10-15 párrafos) debe incluir:
1. Organización del aula para la actividad principal (cómo distribuyes, qué materiales entregas)
2. Presentación de la consigna de trabajo (instrucción COMPLETA y CLARA)
3. Fases de la metodología activa aplicada (cada fase es 1-2 párrafos)
4. Interacciones esperadas (qué hacen los estudiantes mientras circulás)
5. Preguntas de mediación que haces mientras circulás
6. Gestión de la diversidad integrada (cómo apoyas a quienes necesitan ayuda)
7. Productos parciales que van generando
8. Retroalimentación formativa durante el proceso
9. Consolidación del producto final
10. Transición hacia el cierre

## NARRATIVA DEL CIERRE (5-8 párrafos) debe incluir:
1. Socialización de productos (cómo comparten, qué observas)
2. Preguntas de metacognición (qué aprendieron, cómo lo aprendieron, para qué les sirve)
3. Verificación del propósito (retomar criterios de éxito)
4. Síntesis de ideas clave (tú o los estudiantes las enuncian)
5. Conexión con próxima sesión
6. Recojo de evidencias y cierre con mensaje motivador

# DISTRIBUCIÓN DEL TIEMPO
| Momento | % | 45 min | 55 min | 90 min | 135 min |
|---------|---|--------|--------|--------|---------|
| INICIO | 15-20% | 7-9 | 8-11 | 14-18 | 20-27 |
| DESARROLLO | 60-70% | 27-32 | 33-39 | 54-63 | 81-95 |
| CIERRE | 15-20% | 7-9 | 8-11 | 14-18 | 20-27 |

# SCHEMA JSON OBLIGATORIO

{
  "datos_generales": {
    "titulo_sesion": "String creativo orientado a acción/desafío",
    "nivel": "Primaria/Secundaria",
    "grado": "ej: 4to Secundaria",
    "area_academica": "String",
    "duracion": "ej: 90 minutos"
  },
  "situacion_significativa": "PÁRRAFO NARRATIVO ÚNICO (2-3 párrafos unidos). Describe una situación REAL y CERCANA al estudiante. AL FINAL integra las preguntas retadoras: 'Para lograr esto, retamos a los estudiantes a responder: ¿Pregunta 1? ¿Pregunta 2?'",
  "propositos_aprendizaje": [{
    "competencia": "String exacto",
    "capacidades": ["Capacidad 1", "Capacidad 2"],
    "criterios_evaluacion": ["Desempeño 1", "Desempeño 2"],
    "evidencia_aprendizaje": "Producto tangible",
    "instrumento_valoracion": "Rúbrica/Lista de cotejo"
  }],
  "enfoques_transversales": [{
    "nombre": "String del CNEB",
    "descripcion": "Acciones observables"
  }],
  "preparacion": {
    "antes_sesion": "Qué preparar antes",
    "materiales": ["Material 1", "Material 2"]
  },
  "momentos_sesion": [
    {
      "fase": "INICIO",
      "duracion": "15 min",
      "organizacion": "En grupo clase",
      "narrativa_docente": "Haz un breve recuento de lo realizado en la sesión anterior. Recuerda a los estudiantes lo bien que la pasaron y cómo a través de actividades divertidas han podido conocerse un poco más. Incide en lo importante que es encontrar en el aula buenas amigas y amigos, que se cuiden entre sí y colaboren unos con otros.\n\nPídeles que formen un semicírculo, de manera que todas y todos puedan verte y escucharte. Muéstrales las ilustraciones que preparaste para acompañar tu narración, esto será importante para que puedas formular algunas preguntas que les permitan plantearse hipótesis sobre de qué tratará el cuento.\n\nPlantea estas interrogantes: ¿Se imaginan sobre qué tratará...?, ¿por qué creen que...?, ¿quiénes serán los personajes? Registra en la pizarra o en un papelógrafo todas las respuestas.\n\nLee el cuento o presenta el caso. Acompaña la narración con las ilustraciones que preparaste.\n\nDialoga con los niños y las niñas a partir de las siguientes preguntas: ¿Por qué creen que...?, ¿qué hubiera pasado si...?, ¿ustedes creen que...? Permite que los estudiantes intervengan libremente, sin que se sientan presionados.\n\nComunica el propósito de la sesión: 'Hoy vamos a aprender a [verbo] para poder [utilidad práctica]'. Además, indica cómo se evaluarán sus participaciones.\n\nRecuerda a los estudiantes las normas de convivencia y selecciona con ellos las que tendrán en cuenta para el desarrollo de la sesión."
    },
    {
      "fase": "DESARROLLO",
      "duracion": "60 min",
      "organizacion": "En equipos de 4",
      "metodologia_activa": {
        "nombre": "Nombre de la metodología",
        "justificacion": "Por qué es adecuada"
      },
      "narrativa_docente": "Organiza a los estudiantes en equipos de 4 integrantes. Asigna roles: un coordinador que gestiona los tiempos, un secretario que registra las ideas, un portavoz que presentará al grupo, y un verificador que asegura que todos comprendan.\n\nEntrega a cada equipo el material de trabajo. Asegúrate de que todos tengan los recursos necesarios antes de dar la consigna.\n\nPresenta la consigna de trabajo: 'Tienen 20 minutos para [tarea específica]. Deben [pasos claros]. Al finalizar, tendrán [producto esperado]'.\n\nMientras los equipos trabajan, circula por el aula observando los procedimientos. Haz preguntas de mediación: '¿Cómo llegaron a esa conclusión?', '¿Qué pasaría si cambiaran...?', '¿Hay otra forma de verlo?'.\n\nSi detectas que varios equipos cometen el mismo error, pausa brevemente la actividad: 'He notado que varios grupos están [describir]. Veamos juntos: [pregunta guía sin dar la respuesta directa]'.\n\nPara los estudiantes que avanzan rápidamente, ofrece un reto adicional. Para quienes necesitan más apoyo, acércate y proporciona andamiaje adicional.\n\n[Continuar con más párrafos describiendo cada fase de la metodología hasta completar 10-15 párrafos]"
    },
    {
      "fase": "CIERRE",
      "duracion": "15 min",
      "organizacion": "En grupo clase",
      "narrativa_docente": "Organiza la socialización de productos. Pide a cada equipo que coloque su producto en un lugar visible del aula. Indica que rotarán para observar los trabajos de sus compañeros.\n\nGuía la observación con estas preguntas: '¿Qué similitudes encuentran entre los productos?', '¿Qué les llama la atención?', '¿Qué estrategias diferentes usaron los equipos?'.\n\nFacilita la reflexión metacognitiva con las siguientes preguntas: '¿Qué aprendimos hoy?', '¿Cómo lo aprendimos? ¿Qué pasos seguimos?', '¿Qué fue lo más difícil y cómo lo resolvieron?', '¿Dónde pueden usar esto fuera del colegio?'.\n\nRetoma los criterios de éxito planteados al inicio. Permite que los estudiantes evalúen su propio desempeño.\n\nSintetiza las ideas clave de la sesión. Puedes escribirlas en la pizarra o pedirles a los estudiantes que las enuncien.\n\nAnticipa la próxima sesión: 'La próxima clase usaremos lo que aprendimos hoy para [tema/actividad siguiente]'.\n\nRecoge los productos para revisarlos y proporcionar retroalimentación escrita. Despide a los estudiantes con un mensaje motivador."
    }
  ],
  "adaptaciones_sugeridas": {
    "estrategias_diferenciadas": "Descripción general",
    "por_tipo_nee": [{
      "tipo": "Nombre del NEE",
      "en_inicio": "Adaptación",
      "en_desarrollo": "Adaptación",
      "en_cierre": "Adaptación"
    }],
    "apoyo_adicional": ["Estrategia"],
    "extension_avanzados": ["Reto"]
  }
}

# VERIFICACIÓN FINAL
- [ ] situacion_significativa es UN STRING (párrafo narrativo único)
- [ ] Cada momento tiene SOLO "narrativa_docente" (NO actividades_docente/estudiante)
- [ ] La narrativa usa verbos imperativos en segunda persona: "Haz", "Pide", "Muestra"
- [ ] La narrativa NO tiene bullets ni listas con viñetas
- [ ] Hay consignas textuales entre comillas dentro de la narrativa
- [ ] El desarrollo representa 60-70% del tiempo total`;

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
      
      // SANITIZAR caracteres de control antes de parsear
      jsonContent = sanitizeJsonString(jsonContent);
      console.log("JSON sanitized, length:", jsonContent.length);
      
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
      
      console.log("Using EXTENSIVE fallback structure from input data...");
      
      // Calcular tiempos según duración
      const totalMinutos = duracion || 55;
      const inicioMin = Math.round(totalMinutos * 0.18);
      const desarrolloMin = Math.round(totalMinutos * 0.65);
      const cierreMin = Math.round(totalMinutos * 0.17);
      
      // FALLBACK EXTENSO con formato NUEVO (narrativa completa y profesional)
      guiaData = {
        datos_generales: {
          titulo_sesion: `Explorando ${tema}: Una experiencia de aprendizaje significativo`,
          nivel: nivel || "Secundaria",
          grado: grado || "[INFERIDO]",
          area_academica: area || "[NO ESPECIFICADA]",
          duracion: `${totalMinutos} minutos`
        },
        // STRING único con contexto rico
        situacion_significativa: `En el contexto educativo peruano, los estudiantes de ${grado || "este grado"} en el área de ${area || "estudio"} enfrentan situaciones cotidianas que requieren aplicar conocimientos sobre ${tema}. ${contexto || "Esta situación los lleva a cuestionarse sobre cómo resolver problemas reales de su entorno usando lo que aprenden en clase"}. Para lograr esto, retamos a los estudiantes a responder: ¿Cómo podemos aplicar lo aprendido sobre ${tema} en nuestra vida diaria? ¿Qué estrategias o procedimientos nos ayudarán a resolver este tipo de situaciones de manera efectiva?`,
        propositos_aprendizaje: competenciasConDesempenos?.map(item => ({
          competencia: item.competencia,
          capacidades: item.capacidades,
          criterios_evaluacion: item.desempenos,
          evidencia_aprendizaje: "Producto tangible que demuestre el logro de los desempeños",
          instrumento_valoracion: "Lista de cotejo con criterios específicos"
        })) || [],
        enfoques_transversales: enfoquesTransversales?.map(nombre => ({
          nombre,
          descripcion: "Se evidencia cuando los estudiantes aplican los valores de este enfoque en sus interacciones y productos de aprendizaje"
        })) || [],
        preparacion: {
          antes_sesion: "Revisar el material de la sesión anterior para establecer conexiones. Preparar los materiales y recursos necesarios. Organizar el espacio del aula según las actividades planificadas. Anticipar posibles dificultades y preparar estrategias de apoyo.",
          materiales: materiales || recursos || ["Pizarra", "Plumones", "Hojas de trabajo", "Material concreto"]
        },
        momentos_sesion: [
          { 
            fase: "INICIO", 
            duracion: `${inicioMin} min`,
            organizacion: "En grupo clase",
            narrativa_docente: `**Bienvenida:** Recibe a los estudiantes con un saludo personalizado y cálido. Recuérdales lo trabajado en la sesión anterior sobre temas relacionados y cómo esto se conecta con lo que aprenderán hoy. Genera un ambiente de confianza mediante una breve dinámica de activación que los prepare para el aprendizaje.

**Enganche:** Presenta una situación motivadora relacionada con ${tema}. Muéstrales una imagen, un video corto, o plantea una situación problemática de la vida real que capture su atención. Observa sus reacciones y permite que comenten libremente sus primeras impresiones. Pregunta: «¿Qué observan aquí?», «¿Qué les llama la atención?».

**Saberes previos:** Plantea preguntas para activar los conocimientos previos: «¿Qué saben ustedes sobre ${tema}?», «¿Han visto algo parecido en su comunidad o en su vida diaria?», «¿Qué les viene a la mente cuando escuchan este tema?». Registra sus respuestas en la pizarra organizándolas en un mapa mental o lluvia de ideas. Valora todas las participaciones sin corregir en este momento.

**Conflicto cognitivo:** Presenta una pregunta desafiante que desestabilice sus ideas previas: «Si lo que dicen es cierto, entonces ¿cómo explicamos que...?», «¿Qué pasaría si...?». Permite que experimenten la disonancia cognitiva sin darles la respuesta directa. Observa sus reacciones y registra las nuevas preguntas que surjan.

**Propósito:** Comunica el propósito de la sesión de forma clara y en lenguaje estudiantil: «Hoy vamos a aprender a aplicar estrategias para resolver situaciones relacionadas con ${tema}. Al finalizar, serán capaces de [desempeño esperado]». Presenta los criterios de éxito de forma visible en la pizarra o papelógrafo.

**Transición:** Recuerda las normas de convivencia acordadas y selecciona con ellos las más relevantes para esta sesión. Organiza la transición al desarrollo indicando cómo se organizarán para el trabajo.`
          },
          { 
            fase: "DESARROLLO",
            duracion: `${desarrolloMin} min`,
            organizacion: "En equipos de 4",
            metodologia_activa: {
              nombre: "Aprendizaje Cooperativo",
              justificacion: "Promueve la construcción colectiva del conocimiento mediante la interacción entre pares y el desarrollo de habilidades sociales"
            },
            narrativa_docente: `**Organización del aula:** Forma equipos de 4 integrantes considerando la diversidad de niveles de aprendizaje. Asigna roles claros a cada integrante: un coordinador que gestiona los tiempos y la participación, un secretario que registra las ideas y acuerdos, un portavoz que presentará al grupo, y un verificador que asegura que todos comprendan. Entrega a cada estudiante una tarjeta con su rol y sus funciones.

**Entrega de materiales:** Distribuye el material de trabajo a cada equipo. Asegúrate de que todos tengan los recursos necesarios antes de dar la consigna principal. Verifica que entiendan cómo usar los materiales.

**Consigna principal:** Indica con claridad la tarea: «Tienen ${Math.round(desarrolloMin * 0.6)} minutos para trabajar en equipo. Su tarea es [descripción específica de la tarea relacionada con ${tema}]. Al finalizar, deben tener [producto esperado]. Recuerden que cada uno tiene un rol y todos deben participar activamente. ¿Hay alguna pregunta antes de empezar?».

**Mediación durante el trabajo:** Circula por el aula observando los procedimientos de cada equipo. Haz preguntas de mediación que promuevan el pensamiento: «¿Cómo llegaron a esa conclusión?», «¿Qué pasaría si cambiaran este dato?», «¿Hay otra forma de resolverlo?», «¿Todos están de acuerdo? ¿Por qué?», «¿Qué evidencia tienen para afirmar eso?».

**Gestión de errores comunes:** Si detectas que varios equipos cometen el mismo error, pausa brevemente la actividad y dirige la atención del grupo: «He notado que varios grupos están [describir sin señalar]. Veamos juntos: [pregunta guía sin dar la respuesta directa]. ¿Qué podríamos hacer diferente?».

**Atención a la diversidad:** Para los estudiantes que avanzan rápidamente, ofrece un reto adicional de extensión: «Ya que terminaron, ¿podrían pensar en [reto más complejo]?». Para quienes necesitan más apoyo, acércate y proporciona andamiaje adicional: simplifica la consigna, ofrece un ejemplo resuelto como referencia, o asigna un par tutor del mismo equipo.

**Productos parciales:** Verifica que los equipos vayan generando productos intermedios. Cada 10 minutos aproximadamente, pide que muestren su avance: «Muestren con la mano levantada si ya completaron el paso 1». Esto te permite identificar equipos que necesitan apoyo.

**Retroalimentación formativa:** Ofrece retroalimentación específica y oportuna mientras circulás: «Muy bien el procedimiento que usaron, ahora piensen en cómo podrían verificar su respuesta», «Este paso está correcto, pero ¿qué pasa con [aspecto a mejorar]?», «Me gusta cómo están trabajando en equipo».

**Consolidación:** Cuando falten 5 minutos para el cierre del desarrollo, anuncia: «Tienen 5 minutos para completar su producto final. Asegúrense de que esté listo para compartir con el grupo. El portavoz debe preparar una breve explicación de cómo trabajaron».

**Transición al cierre:** Indica que es momento de socializar los productos. Pide que ordenen sus espacios, guarden los materiales y se preparen para las presentaciones.`
          },
          { 
            fase: "CIERRE",
            duracion: `${cierreMin} min`,
            organizacion: "En grupo clase",
            narrativa_docente: `**Socialización de productos:** Organiza las presentaciones de los equipos. Puedes usar la técnica de galería (todos colocan sus productos en un lugar visible y rotan observando) o presentaciones breves por equipo (2 minutos cada uno). Si usas galería, indica: «Cada equipo coloque su producto en su mesa. Ahora rotaremos en sentido horario observando los trabajos de los demás».

**Observación guiada:** Mientras observan los productos de otros equipos, guía la observación con preguntas: «¿Qué similitudes encuentran entre los productos?», «¿Qué estrategias diferentes usaron los equipos?», «¿Qué les llama la atención?», «¿Hay algo que otro equipo hizo que les gustaría haber pensado?».

**Metacognición:** Facilita la reflexión sobre el proceso de aprendizaje con preguntas como: «¿Qué aprendimos hoy sobre ${tema}?», «¿Cómo lo aprendimos? ¿Qué pasos seguimos?», «¿Qué fue lo más difícil y cómo lo resolvieron?», «¿Qué estrategia les funcionó mejor?», «¿Dónde pueden usar esto fuera del colegio?». Permite que varios estudiantes compartan sus reflexiones.

**Verificación del propósito:** Retoma los criterios de éxito planteados al inicio y pregunta: «Revisemos nuestro propósito inicial. ¿Logramos lo que nos propusimos? ¿Cómo lo sabemos?». Permite que los estudiantes evalúen su propio desempeño levantando la mano o con una escala de autoevaluación rápida.

**Síntesis de ideas clave:** Resume o pide a los estudiantes que resuman las ideas principales de la sesión. Escríbelas de forma visible en la pizarra: «Entonces, las ideas más importantes de hoy son...». Verifica que todos las hayan registrado.

**Conexión con próxima sesión:** Anticipa lo que trabajarán en la siguiente clase: «La próxima clase profundizaremos en [tema siguiente]. Usaremos lo que aprendimos hoy para [conexión]. Piensen en [tarea de reflexión]».

**Recojo de evidencias y cierre motivador:** Recoge los productos de los equipos para revisarlos y proporcionar retroalimentación escrita. Despide a los estudiantes con un mensaje positivo y motivador: «Hoy demostraron que pueden trabajar en equipo y resolver situaciones complejas. ¡Excelente trabajo! Los felicito por su esfuerzo y participación».`
          }
        ],
        adaptaciones_sugeridas: {
          estrategias_diferenciadas: adaptaciones?.length 
            ? `Para atender a estudiantes con ${adaptaciones.join(', ')}, se aplican principios de Diseño Universal para el Aprendizaje (DUA): múltiples formas de presentación (visual, auditiva, kinestésica), múltiples formas de expresión (oral, escrita, gráfica), y múltiples formas de motivación (elección, relevancia personal, metas claras). Las adaptaciones específicas se integran en cada momento de la sesión.`
            : "Se aplican principios de Diseño Universal para el Aprendizaje (DUA) para atender la diversidad del aula: múltiples formas de presentación, expresión y motivación.",
          por_tipo_nee: adaptaciones?.map(tipo => ({
            tipo,
            en_inicio: getAdaptacionInicio(tipo),
            en_desarrollo: getAdaptacionDesarrollo(tipo),
            en_cierre: getAdaptacionCierre(tipo)
          })) || [],
          apoyo_adicional: [
            "Ofrecer instrucciones fragmentadas en pasos pequeños y secuenciados",
            "Proporcionar materiales complementarios visuales (organizadores gráficos, mapas conceptuales)",
            "Asignar un par tutor para apoyo entre iguales cuando sea apropiado",
            "Verificar comprensión mediante parafraseo antes de iniciar cada actividad",
            "Dar tiempo extra para procesar información y completar tareas"
          ],
          extension_avanzados: [
            "Proponer retos de mayor complejidad cognitiva que requieran análisis o síntesis",
            "Asignar rol de tutor par para apoyar a compañeros que lo necesiten",
            "Ofrecer investigación adicional sobre aspectos avanzados del tema",
            "Conectar con problemas más abstractos, generalizables o de otros campos del conocimiento"
          ],
          recursos_apoyo: [
            "Organizadores gráficos para estructurar información compleja",
            "Tarjetas de apoyo con pasos del procedimiento y ejemplos",
            "Timer visual para gestión del tiempo y anticipación de transiciones",
            "Listas de verificación para autoevaluación del progreso"
          ]
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

    // Normalize momentos_sesion - PRIORIZAR formato narrativo nuevo
    const normalizedMomentos = (guiaData.momentos_sesion || []).map((m: any) => {
      const normalized: any = {
        fase: m.fase,
        duracion: m.duracion,
        organizacion: m.organizacion || "En grupo clase",
        narrativa_docente: m.narrativa_docente || "",
      };

      // Copiar metodologia_activa si existe (solo para DESARROLLO)
      if (m.metodologia_activa) normalized.metodologia_activa = m.metodologia_activa;

      // NO copiar campos legacy (actividades_docente, actividades_estudiante, objetivo_fase)
      // Estos campos se ELIMINAN del output para forzar el formato nuevo
      
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
      // Situación significativa SIEMPRE como string (párrafo narrativo único)
      situacion_significativa: typeof guiaData.situacion_significativa === 'string' 
        ? guiaData.situacion_significativa 
        : (guiaData.situacion_significativa?.contexto 
            ? `${guiaData.situacion_significativa.contexto} ${guiaData.situacion_significativa.reto || ''} ${guiaData.situacion_significativa.producto || ''}`.trim()
            : `En el contexto educativo peruano, los estudiantes se enfrentan al reto de comprender ${tema}. Esta situación requiere que apliquen sus conocimientos previos y desarrollen nuevas habilidades. Nos preguntamos: ¿Cómo podemos aplicar lo aprendido sobre ${tema}?`),
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
