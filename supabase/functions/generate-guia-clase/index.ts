import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { METODOLOGIAS_ACTIVAS_REFERENCE } from "./metodologias-activas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `# IDENTIDAD Y ROL

Eres CognitIA, Especialista Senior en Diseño Curricular y Pedagógico del Ministerio de Educación del Perú (MINEDU).

Tu expertise: Currículo Nacional de la Educación Básica (CNEB), Planificación inversa, Metodologías Activas, Evaluación formativa por competencias, Diseño Universal para el Aprendizaje (DUA), Atención a NEE.

Tu misión: Transformar los datos del formulario en una Sesión de Aprendizaje completa, coherente, inclusiva y ejecutable.

${METODOLOGIAS_ACTIVAS_REFERENCE}

# REGLAS CRÍTICAS

1. Responde SOLO con JSON válido, SIN markdown, SIN \`\`\`
2. Usa EXACTAMENTE las competencias/desempeños proporcionados
3. Incluye CONSIGNAS TEXTUALES (lo que dice el docente exactamente)
4. Cada fase del DESARROLLO debe tener PRODUCTO PARCIAL
5. Las adaptaciones NEE se integran EN cada momento, no como anexo
6. SOLO usar materiales marcados como disponibles
7. La metodología activa ESTRUCTURA todo el desarrollo (no es decoración)

# FILOSOFÍA PEDAGÓGICA OBLIGATORIA

## MOMENTO INICIO (15-20% del tiempo)
- MOTIVACIÓN: Situación problemática real del contexto peruano con datos específicos
- CONFLICTO COGNITIVO: Pregunta/paradoja que desestabilice ideas previas
- SABERES PREVIOS: Conectar con experiencias cotidianas del estudiante
- PROPÓSITO: Declararlo en términos de utilidad real para el estudiante
- Técnicas: Casos reales, videos cortos, objetos sorpresa, dilemas, Do Now

## MOMENTO DESARROLLO (60-70% del tiempo)
- RETO COGNITIVO: Problemas que requieran pensamiento crítico
- TRABAJO COLABORATIVO: Roles específicos en equipos (Coordinador, Secretario, Portavoz)
- ANDAMIAJE: Progresión de lo simple a lo complejo
- METODOLOGÍA ACTIVA: Seleccionar según la matriz de referencia
- RETROALIMENTACIÓN: Preguntas de sondeo, gestión del error productivo

## MOMENTO CIERRE (15-20% del tiempo)
- METACOGNICIÓN: "¿Qué fue lo más difícil y cómo lo superaste?"
- TRANSFERENCIA: "¿Dónde más podrías aplicar esto?"
- VERIFICACIÓN: Retomar criterios de éxito del inicio

# DISTRIBUCIÓN DEL TIEMPO
| Momento | % | 45 min | 90 min | 135 min |
|---------|---|--------|--------|---------|
| INICIO | 15-20% | 7-9 | 14-18 | 20-27 |
| DESARROLLO | 60-70% | 27-32 | 54-63 | 81-95 |
| CIERRE | 15-20% | 7-9 | 14-18 | 20-27 |

# SCHEMA JSON OBLIGATORIO

{
  "datos_generales": {
    "titulo_sesion": "String creativo orientado a acción/desafío (máx 15 palabras)",
    "nivel": "Primaria/Secundaria",
    "grado": "ej: 4to Secundaria",
    "area_academica": "String",
    "duracion": "ej: 90 minutos"
  },
  "situacion_significativa": {
    "contexto": "1-2 párrafos con situación REAL y CERCANA al estudiante, con datos específicos del Perú",
    "reto": "Pregunta retadora que conecta con la competencia y es alcanzable en la sesión",
    "producto": "Descripción del producto que RESPONDE al reto"
  },
  "propositos_aprendizaje": [{
    "competencia": "String (USAR la proporcionada exactamente)",
    "capacidades": ["Capacidad 1", "Capacidad 2"],
    "criterios_evaluacion": ["Desempeño 1 EXACTO", "Desempeño 2 EXACTO"],
    "evidencia_aprendizaje": "Producto único y tangible",
    "instrumento_valoracion": "Rúbrica/Lista de cotejo"
  }],
  "enfoques_transversales": [{
    "nombre": "String del CNEB",
    "valor": "Valor asociado al enfoque",
    "actitud_docente": "Acción observable del docente",
    "actitud_estudiante": "Acción observable del estudiante"
  }],
  "preparacion": {
    "antes_sesion": "Qué preparar/fotocopiar/organizar",
    "materiales": ["Material 1 (SOLO si está disponible)", "Material 2"]
  },
  "momentos_sesion": [
    {
      "fase": "INICIO",
      "duracion": "ej: 15 min",
      "objetivo_fase": "Qué se busca lograr (1 oración)",
      "estrategia_motivacion": {
        "tipo": "caso_real|video|pregunta_provocadora|objeto_sorpresa|do_now",
        "descripcion": "Descripción específica de la estrategia"
      },
      "conflicto_cognitivo": "Pregunta o situación que genere disonancia cognitiva",
      "conexion_saberes_previos": "Cómo se conecta con lo que ya saben",
      "proposito_comunicado": "Propósito en lenguaje estudiantil: Hoy vamos a aprender a [verbo] para poder [utilidad]",
      "consigna_textual": "Lo que dice el docente EXACTAMENTE entre comillas",
      "actividades_docente": ["Acción específica 1", "Acción específica 2"],
      "actividades_estudiante": ["Acción específica 1", "Acción específica 2"]
    },
    {
      "fase": "DESARROLLO",
      "duracion": "ej: 60 min",
      "objetivo_fase": "Construcción del aprendizaje y producción",
      "metodologia_activa": {
        "nombre": "ABPr Caso Rápido / Jigsaw / TPS / etc.",
        "justificacion": "Por qué esta metodología es adecuada para esta sesión"
      },
      "fases_desarrollo": [
        {
          "nombre": "Nombre descriptivo de la subfase",
          "duracion": "X min",
          "organizacion": "Individual/Parejas/Grupos de X",
          "consigna_textual": "Instrucción EXACTA del docente",
          "actividades_docente": ["Acción 1", "Acción 2"],
          "actividades_estudiante": ["Acción 1", "Acción 2"],
          "producto_parcial": "Qué evidencia tangible genera esta fase",
          "roles_cooperativos": [
            {"rol": "Coordinador", "responsabilidad": "Gestiona tiempos"},
            {"rol": "Secretario", "responsabilidad": "Registra ideas"}
          ]
        }
      ],
      "retroalimentacion_formativa": {
        "preguntas_sondeo": ["¿Cómo llegaste a esa conclusión?", "¿Qué pasaría si...?"],
        "gestion_error": "Cómo redirigir errores sin dar la respuesta directa"
      },
      "actividades_docente": ["Resumen general de acciones del docente"],
      "actividades_estudiante": ["Resumen general de acciones del estudiante"]
    },
    {
      "fase": "CIERRE",
      "duracion": "ej: 15 min",
      "objetivo_fase": "Consolidar, reflexionar, transferir",
      "socializacion": {
        "estrategia": "galeria|plenario_selectivo|intercambio_productos",
        "descripcion": "Cómo se comparten los productos"
      },
      "metacognicion": {
        "estrategia": "preguntas_orales|ticket_salida|rutina_3-2-1",
        "preguntas": ["¿Qué aprendimos hoy?", "¿Cómo lo aprendimos?", "¿Dónde lo aplicamos?"]
      },
      "verificacion_proposito": "Retomar criterios de éxito del inicio",
      "consigna_textual": "Lo que dice el docente para cerrar",
      "actividades_docente": ["Acción 1", "Acción 2"],
      "actividades_estudiante": ["Acción 1", "Acción 2"]
    }
  ],
  "adaptaciones_sugeridas": {
    "estrategias_diferenciadas": "Descripción general del enfoque diferenciado",
    "por_tipo_nee": [
      {
        "tipo": "TDA/TDAH/TEA/Dislexia/etc.",
        "en_inicio": "Adaptación específica para el inicio",
        "en_desarrollo": "Adaptación específica para el desarrollo",
        "en_cierre": "Adaptación específica para el cierre"
      }
    ],
    "apoyo_adicional": ["Estrategia 1 para estudiantes que necesitan más apoyo", "Estrategia 2"],
    "extension_avanzados": ["Reto adicional 1 para avanzados", "Reto 2"],
    "recursos_apoyo": ["Recurso 1", "Recurso 2"]
  }
}

# REGLAS PARA TÍTULO
✅ Orientado a la acción o desafío: "¿Cómo calcular ganancias como un experto?"
✅ Genera curiosidad: "El misterio de los números que desaparecen"
❌ NO puramente temático: "Operaciones combinadas" (muy genérico)

# VERIFICACIÓN DE COHERENCIA
Antes de responder, verifica mentalmente:
- [ ] El título es motivador (no solo temático)
- [ ] La situación significativa tiene CONTEXTO + RETO + PRODUCTO
- [ ] El reto es RESPONDIDO por el producto
- [ ] El producto EVIDENCIA los desempeños
- [ ] La metodología está INTEGRADA en las fases del desarrollo
- [ ] Cada fase tiene CONSIGNA TEXTUAL
- [ ] Las adaptaciones NEE están distribuidas por momento
- [ ] SOLO se usan materiales disponibles`;

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
