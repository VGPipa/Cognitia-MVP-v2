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
3. CADA momento debe tener el campo "narrativa_docente" con texto EXTENSO en segunda persona
4. La narrativa_docente debe incluir CONSIGNAS TEXTUALES entre comillas (lo que dice el docente)
5. La narrativa_docente debe describir CÓMO organizar el aula, CÓMO reaccionan los estudiantes
6. Las adaptaciones NEE se integran DENTRO de la narrativa, no como sección aparte
7. SOLO usar materiales marcados como disponibles (restricción ESTRICTA)
8. Calcular tiempos según duración total: INICIO 15-20%, DESARROLLO 60-70%, CIERRE 15-20%

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
    "titulo_sesion": "String creativo orientado a acción/desafío. EVITAR genéricos como 'Operaciones combinadas'. USAR: '¿Cómo calcular ganancias como un experto?' o 'Diseñamos la dieta perfecta'",
    "nivel": "Primaria/Secundaria",
    "grado": "ej: 4to Secundaria",
    "area_academica": "String",
    "duracion": "ej: 90 minutos"
  },
  "situacion_significativa": "PÁRRAFO NARRATIVO ÚNICO (2-3 párrafos unidos) que describe una situación REAL y CERCANA al estudiante. Debe: partir de realidad local/regional/nacional, incluir DATOS ESPECÍFICOS (cifras, nombres de lugares reales si aplica), conectar con intereses del grado/edad, integrar el contexto del grupo si fue proporcionado. AL FINAL del párrafo, INTEGRAR las preguntas retadoras que despiertan interés y demandan combinar competencias, en estilo: 'Para lograr esto, retamos a los estudiantes a responder: ¿Pregunta 1? ¿Pregunta 2? ¿Pregunta 3?'. NO SEPARAR en contexto/reto/producto. EJEMPLO: 'Las niñas y los niños del primer grado se encuentran en un proceso de transición entre el nivel inicial y el primer grado. Esto implica para ellos llegar a otra escuela, a otra aula, así como tener un nuevo docente y conocer nuevos(as) compañeros(as). Para que este tránsito sea positivo, es preciso realizar actividades que les permitan sentirse acogidos. Asimismo, es importante que puedan hacer de su aula un ambiente donde todos puedan disfrutar y que ofrezca condiciones para aprender juntos. Para lograr esto, retamos a los estudiantes a responder: ¿Qué podemos hacer para sentirnos bien en nuestro salón? ¿Qué nos gustaría encontrar en nuestra aula? ¿Cómo podemos organizar y ambientar nuestra aula para que todos nos sintamos acogidos? ¿Qué responsabilidades debemos asumir para mantener organizados nuestros espacios?'",
  "propositos_aprendizaje": [{
    "competencia": "String (USAR la proporcionada exactamente)",
    "capacidades": ["Capacidad 1 exacta", "Capacidad 2 exacta"],
    "criterios_evaluacion": ["Desempeño 1 EXACTO", "Desempeño 2 EXACTO"],
    "evidencia_aprendizaje": "Producto tangible que demuestra los desempeños",
    "instrumento_valoracion": "Rúbrica/Lista de cotejo"
  }],
  "enfoques_transversales": [{
    "nombre": "String del CNEB",
    "descripcion": "Acciones observables del docente y estudiantes"
  }],
  "preparacion": {
    "antes_sesion": "Qué preparar antes de la sesión",
    "materiales": ["Material 1", "Material 2"]
  },
  "momentos_sesion": [
    {
      "fase": "INICIO",
      "duracion": "ej: 15 min",
      "organizacion": "En grupo clase / Individual / En parejas",
      "narrativa_docente": "TEXTO NARRATIVO EXTENSO EN SEGUNDA PERSONA (6-10 párrafos). Cada párrafo describe una acción concreta que ejecutas como docente. Incluye consignas textuales entre comillas. Describe cómo reaccionan los estudiantes. Incluye las preguntas específicas que haces. Ejemplo: 'Haz un breve recuento de lo realizado en la sesión anterior. Recuerda a los estudiantes lo bien que la pasaron y cómo a través de actividades divertidas han podido conocerse un poco más. Incide en lo importante que es encontrar en el aula buenas amigas y amigos, que se cuiden entre sí y colaboren unos con otros.\\n\\nPídeles que formen un semicírculo, de manera que todas y todos puedan verte y escucharte. Muéstrales las ilustraciones que preparaste para acompañar tu narración, esto será importante para que puedas formular algunas preguntas que les permitan plantearse hipótesis sobre de qué tratará el cuento.\\n\\nPlantea estas interrogantes: ¿Se imaginan sobre qué tratará...?, ¿por qué creen que...?, ¿quiénes serán los personajes? Registra en la pizarra o en un papelógrafo todas las respuestas.\\n\\nLee el cuento o presenta el caso. Acompaña la narración con las ilustraciones que preparaste.\\n\\nDialoga con los niños y las niñas a partir de las siguientes preguntas: ¿Por qué creen que...?, ¿qué hubiera pasado si...?, ¿ustedes creen que...? Permite que los estudiantes intervengan libremente, sin que se sientan presionados.\\n\\nComunica el propósito de la sesión: \"Hoy vamos a aprender a [verbo] para poder [utilidad práctica]\". Además, indica cómo se evaluarán sus participaciones.\\n\\nRecuerda a los estudiantes las normas de convivencia y selecciona con ellos las que tendrán en cuenta para el desarrollo de la sesión.'"
    },
    {
      "fase": "DESARROLLO",
      "duracion": "ej: 60 min",
      "organizacion": "Individual / En parejas / En equipos de 4",
      "metodologia_activa": {
        "nombre": "Nombre de la metodología",
        "justificacion": "Por qué es adecuada"
      },
      "narrativa_docente": "TEXTO NARRATIVO EXTENSO EN SEGUNDA PERSONA (10-15 párrafos). Cada párrafo describe acciones concretas. Organiza el texto siguiendo las fases de la metodología activa elegida. Incluye consignas textuales completas entre comillas. Describe cómo circulás y qué preguntas de mediación haces. Indica cómo gestionas la diversidad (estudiantes que avanzan rápido, estudiantes que necesitan apoyo). Describe los productos parciales que van generando. Ejemplo: 'Organiza a los estudiantes en equipos de 4 integrantes. Asigna roles: un coordinador que gestiona los tiempos, un secretario que registra las ideas, un portavoz que presentará al grupo, y un verificador que asegura que todos comprendan.\\n\\nEntrega a cada equipo el material de trabajo: [descripción]. Asegúrate de que todos tengan los recursos necesarios antes de dar la consigna.\\n\\nPresenta la consigna de trabajo: \"Tienen 20 minutos para [tarea específica]. Deben [pasos claros]. Al finalizar, tendrán [producto esperado]\".\\n\\nMientras los equipos trabajan, circula por el aula observando los procedimientos. Haz preguntas de mediación: \"¿Cómo llegaron a esa conclusión?\", \"¿Qué pasaría si cambiaran...?\", \"¿Hay otra forma de verlo?\".\\n\\nSi detectas que varios equipos cometen el mismo error, pausa brevemente la actividad: \"He notado que varios grupos están [describir]. Veamos juntos: [pregunta guía sin dar la respuesta directa]\".\\n\\nPara los estudiantes que avanzan rápidamente, ofrece un reto adicional: [descripción]. Para quienes necesitan más apoyo, acércate y proporciona andamiaje adicional: [estrategia específica].\\n\\n[Continuar con más párrafos describiendo cada fase de la metodología...]'"
    },
    {
      "fase": "CIERRE",
      "duracion": "ej: 15 min",
      "organizacion": "En grupo clase",
      "narrativa_docente": "TEXTO NARRATIVO EXTENSO EN SEGUNDA PERSONA (5-8 párrafos). Incluye socialización de productos, metacognición con preguntas específicas, verificación del propósito, síntesis de ideas clave, conexión con próxima sesión, recojo de evidencias y mensaje de cierre. Ejemplo: 'Organiza la socialización de productos. Pide a cada equipo que coloque su producto en un lugar visible del aula. Indica que rotarán para observar los trabajos de sus compañeros.\\n\\nGuía la observación con estas preguntas: \"¿Qué similitudes encuentran entre los productos?\", \"¿Qué les llama la atención?\", \"¿Qué estrategias diferentes usaron los equipos?\".\\n\\nFacilita la reflexión metacognitiva con las siguientes preguntas: \"¿Qué aprendimos hoy?\", \"¿Cómo lo aprendimos? ¿Qué pasos seguimos?\", \"¿Qué fue lo más difícil y cómo lo resolvieron?\", \"¿Dónde pueden usar esto fuera del colegio?\".\\n\\nRetoma los criterios de éxito planteados al inicio: \"Revisemos nuestros criterios. ¿Logramos [criterio 1]? ¿Logramos [criterio 2]?\". Permite que los estudiantes evalúen su propio desempeño.\\n\\nSintetiza las ideas clave de la sesión: [idea 1], [idea 2], [idea 3]. Puedes escribirlas en la pizarra o pedirles a los estudiantes que las enuncien.\\n\\nAnticipa la próxima sesión: \"La próxima clase usaremos lo que aprendimos hoy para [tema/actividad siguiente]\".\\n\\nRecoge los productos para revisarlos y proporcionar retroalimentación escrita. Despide a los estudiantes con un mensaje motivador: \"[Frase que conecta el aprendizaje con la vida real o con el propósito mayor]\".'"
    }
  ],
  "adaptaciones_sugeridas": {
    "estrategias_diferenciadas": "Descripción general del enfoque de atención a la diversidad",
    "por_tipo_nee": [{
      "tipo": "Nombre del NEE",
      "en_inicio": "Cómo adaptar el inicio",
      "en_desarrollo": "Cómo adaptar el desarrollo",
      "en_cierre": "Cómo adaptar el cierre"
    }],
    "apoyo_adicional": ["Estrategia para estudiantes que necesitan más apoyo"],
    "extension_avanzados": ["Reto para estudiantes avanzados"]
  }
}

# VERIFICACIÓN FINAL (CHECKLIST)
- [ ] situacion_significativa es UN PÁRRAFO ÚNICO (no objeto con contexto/reto/producto)
- [ ] Cada momento tiene narrativa_docente como TEXTO EXTENSO en segunda persona
- [ ] La narrativa usa verbos imperativos: "Haz", "Pide", "Muestra", "Indica", "Circula"
- [ ] La narrativa NO tiene bullets ni listas con viñetas
- [ ] Hay consignas textuales entre comillas dentro de la narrativa
- [ ] El desarrollo representa 60-70% del tiempo total
- [ ] SOLO se usan materiales marcados como disponibles`;

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
