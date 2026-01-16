import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres el "Arquitecto Pedagógico" de Cognitia. Genera GUÍAS DE CLASE en JSON para escuelas peruanas (CNEB/MINEDU).

### REGLAS CRÍTICAS:
1. Responde SOLO con JSON válido, SIN markdown, SIN \`\`\`
2. Sé CONCISO: máximo 2-3 oraciones por actividad
3. Usa EXACTAMENTE las competencias/desempeños proporcionados
4. NO incluyas texto antes ni después del JSON

### SCHEMA JSON OBLIGATORIO:
{
  "datos_generales": {
    "titulo_sesion": "String creativo (máx 15 palabras)",
    "nivel": "Primaria/Secundaria",
    "grado": "ej: 4to Secundaria",
    "area_academica": "String",
    "duracion": "ej: 90 minutos"
  },
  "propositos_aprendizaje": [{
    "competencia": "String (USAR la proporcionada)",
    "capacidades": ["Capacidad 1", "Capacidad 2"],
    "criterios_evaluacion": ["Desempeño 1", "Desempeño 2"],
    "evidencia_aprendizaje": "String breve",
    "instrumento_valoracion": "Rúbrica/Lista de cotejo"
  }],
  "enfoques_transversales": [{
    "nombre": "String",
    "descripcion": "String breve (1 oración)"
  }],
  "preparacion": {
    "antes_sesion": "String breve",
    "materiales": ["Material 1", "Material 2"]
  },
  "momentos_sesion": [
    {
      "fase": "INICIO",
      "duracion": "ej: 15 min",
      "actividades": "Resumen breve",
      "objetivo_fase": "Qué se busca (1 oración)",
      "actividades_docente": ["Acción 1", "Acción 2", "Acción 3"],
      "actividades_estudiante": ["Acción 1", "Acción 2", "Acción 3"]
    },
    {
      "fase": "DESARROLLO",
      "duracion": "ej: 60 min",
      "actividades": "Resumen breve",
      "objetivo_fase": "Qué se busca (1 oración)",
      "actividades_docente": ["Acción 1", "Acción 2", "Acción 3", "Acción 4"],
      "actividades_estudiante": ["Acción 1", "Acción 2", "Acción 3", "Acción 4"]
    },
    {
      "fase": "CIERRE",
      "duracion": "ej: 15 min",
      "actividades": "Resumen breve",
      "objetivo_fase": "Metacognición (1 oración)",
      "actividades_docente": ["Acción 1", "Acción 2"],
      "actividades_estudiante": ["Acción 1", "Acción 2"]
    }
  ],
  "adaptaciones_sugeridas": {
    "estrategias_diferenciadas": "Descripción general breve",
    "apoyo_adicional": ["Estrategia 1", "Estrategia 2"],
    "extension_avanzados": ["Actividad 1", "Actividad 2"],
    "recursos_apoyo": ["Recurso 1", "Recurso 2"]
  }
}

### FILOSOFÍA (aplicar pero NO escribir en JSON):
- INICIO: Conexión emocional + saberes previos + propósito
- DESARROLLO: Reto cognitivo + trabajo colaborativo
- CIERRE: Metacognición`;

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
  // Nueva estructura de competencias con desempeños
  competenciasConDesempenos?: CompetenciaConDesempenos[];
  enfoquesTransversales?: string[];
  adaptaciones?: string[];
  adaptacionesPersonalizadas?: string;
  materiales?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Build the user prompt with all available data
    const adaptacionesText = adaptaciones && adaptaciones.length > 0
      ? adaptaciones.join(', ')
      : 'Ninguna especificada';

    const materialesText = materiales && materiales.length > 0
      ? materiales.join(', ')
      : recursos?.length > 0 ? recursos.join(', ') : '[Recursos básicos de aula]';

    // Build competencias section with structured desempeños from the form
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

MATERIALES DISPONIBLES:
${materialesText}

ADAPTACIONES REQUERIDAS (NEE):
${adaptacionesText}
${adaptacionesPersonalizadas ? `\nOtras consideraciones: ${adaptacionesPersonalizadas}` : ''}

CONTEXTO DEL GRUPO:
${contexto || '[Usar contexto general para adolescentes peruanos]'}

INSTRUCCIONES CRÍTICAS:
1. En propositos_aprendizaje, USAR EXACTAMENTE las competencias proporcionadas
2. Para cada competencia, en criterios_evaluacion usar un ARRAY con los desempeños EXACTOS proporcionados
3. NO modificar ni parafrasear los desempeños - copiarlos textualmente
4. Incluir el campo "duracion" en datos_generales (ej: "${duracion || 55} minutos")
5. Generar actividades diferenciadas para cada tipo de adaptación indicada`;

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

    // Parse the JSON response - handle markdown code blocks and truncation
    let guiaData;
    try {
      // Remove markdown code blocks if present
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
      
      // Try to fix truncated JSON
      if (!jsonContent.endsWith('}')) {
        console.warn("Response appears truncated, attempting advanced fix...");
        
        // Strategy 1: Find last complete brace match
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
          // Strategy 2: Try to close the JSON structure manually
          console.warn("Attempting to close JSON structure manually...");
          
          // Count unclosed braces/brackets (ignoring strings)
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
          
          // Check if we're in an unclosed string (odd number of quotes after last escape)
          const lastQuoteIndex = jsonContent.lastIndexOf('"');
          const contentAfterQuote = jsonContent.substring(lastQuoteIndex + 1);
          const hasUnclosedString = !contentAfterQuote.includes('"') && 
            (jsonContent.split('"').length % 2 === 0);
          
          if (hasUnclosedString) {
            jsonContent += '"';
          }
          
          // Close arrays and objects
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
      
      // Fallback: return a minimal valid structure using the input data
      console.log("Using fallback structure from input data...");
      guiaData = {
        datos_generales: {
          titulo_sesion: `Sesión: ${tema}`,
          nivel: nivel || "Secundaria",
          grado: grado || "[INFERIDO]",
          area_academica: area || "[NO ESPECIFICADA]",
          duracion: `${duracion || 55} minutos`
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
          { fase: "INICIO", duracion: "15 min", actividades: "Motivación y saberes previos", objetivo_fase: "Conectar con el tema", actividades_docente: ["Presentar el propósito"], actividades_estudiante: ["Participar activamente"] },
          { fase: "DESARROLLO", duracion: `${Math.max((duracion || 55) - 25, 30)} min`, actividades: "Desarrollo del tema", objetivo_fase: "Lograr el aprendizaje", actividades_docente: ["Guiar el proceso"], actividades_estudiante: ["Trabajar en equipo"] },
          { fase: "CIERRE", duracion: "10 min", actividades: "Metacognición", objetivo_fase: "Reflexionar sobre lo aprendido", actividades_docente: ["Facilitar la reflexión"], actividades_estudiante: ["Compartir aprendizajes"] }
        ],
        adaptaciones_sugeridas: {
          estrategias_diferenciadas: adaptaciones?.length ? `Estrategias para: ${adaptaciones.join(', ')}` : "Sin adaptaciones específicas"
        }
      };
    }

    // Normalize propositos_aprendizaje to ensure criterios_evaluacion and capacidades are arrays
    const normalizedPropositos = (guiaData.propositos_aprendizaje || []).map((p: any, index: number) => {
      // Get capacidades from the original input if available
      const inputCapacidades = competenciasConDesempenos?.[index]?.capacidades || [];
      return {
        ...p,
        capacidades: Array.isArray(p.capacidades) ? p.capacidades : inputCapacidades,
        criterios_evaluacion: Array.isArray(p.criterios_evaluacion) 
          ? p.criterios_evaluacion 
          : [p.criterios_evaluacion || "Desempeño por definir"]
      };
    });

    // Build default propositos from competenciasConDesempenos if AI didn't return any
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

    const guiaClase = {
      datos_generales: {
        titulo_sesion: guiaData.datos_generales?.titulo_sesion || `Sesión: ${tema}`,
        nivel: guiaData.datos_generales?.nivel || nivel || "Secundaria",
        grado: guiaData.datos_generales?.grado || grado || "[INFERIDO]",
        area_academica: guiaData.datos_generales?.area_academica || area || "[NO ESPECIFICADA]",
        duracion: guiaData.datos_generales?.duracion || `${duracion || 55} minutos`
      },
      propositos_aprendizaje: normalizedPropositos.length > 0 ? normalizedPropositos : defaultPropositos,
      enfoques_transversales: guiaData.enfoques_transversales || (
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
      momentos_sesion: guiaData.momentos_sesion || [
        {
          fase: "INICIO",
          duracion: "10 min",
          actividades: "Activación de conocimientos previos y presentación del propósito"
        },
        {
          fase: "DESARROLLO",
          duracion: `${Math.max((duracion || 55) - 20, 30)} min`,
          actividades: "Desarrollo de actividades principales"
        },
        {
          fase: "CIERRE",
          duracion: "10 min",
          actividades: "Metacognición y reflexión final"
        }
      ],
      adaptaciones_sugeridas: guiaData.adaptaciones_sugeridas || {
        estrategias_diferenciadas: adaptaciones && adaptaciones.length > 0
          ? `Estrategias específicas para: ${adaptaciones.join(', ')}`
          : "Sin adaptaciones específicas requeridas"
      }
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
