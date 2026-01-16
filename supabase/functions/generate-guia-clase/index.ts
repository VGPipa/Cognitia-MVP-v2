import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Eres el "Arquitecto Pedagógico" de Cognitia, una IA experta en diseñar sesiones de aprendizaje para escuelas peruanas alineadas al Currículo Nacional (CNEB). Tu objetivo es generar una GUÍA DE CLASE en formato JSON estricto siguiendo la estructura oficial del MINEDU.

### INSTRUCCIONES CRÍTICAS:
1. DEBES usar EXACTAMENTE las competencias, capacidades y desempeños que se te proporcionan
2. La salida debe ser ÚNICAMENTE un objeto JSON válido
3. No incluyas texto antes ni después del JSON
4. Si falta información, infiere lo más adecuado para el contexto peruano
5. IMPORTANTE: Los criterios_evaluacion deben ser un ARRAY de desempeños específicos por competencia

### ESTRUCTURA DEL JSON (SCHEMA OBLIGATORIO):
{
  "datos_generales": {
    "titulo_sesion": "String creativo y descriptivo",
    "nivel": "String (Primaria/Secundaria)",
    "grado": "String (ej: 4to Secundaria)",
    "area_academica": "String",
    "duracion": "String (ej: 90 minutos)"
  },
  "propositos_aprendizaje": [
    {
      "competencia": "String (USAR la competencia proporcionada)",
      "criterios_evaluacion": [
        "String - Desempeño 1 observable y medible para esta competencia",
        "String - Desempeño 2 observable y medible para esta competencia"
      ],
      "evidencia_aprendizaje": "String (producto o actuación que demuestra el aprendizaje)",
      "instrumento_valoracion": "String (Rúbrica, Lista de cotejo, etc.)"
    }
  ],
  "enfoques_transversales": [
    {
      "nombre": "String (USAR el enfoque proporcionado si existe)",
      "descripcion": "String (cómo se evidencia en la sesión)"
    }
  ],
  "preparacion": {
    "antes_sesion": "String (qué debe hacer el docente antes)",
    "materiales": ["String", "String"]
  },
  "momentos_sesion": [
    {
      "fase": "INICIO",
      "duracion": "String (ej: 15 min)",
      "actividades": "String (descripción detallada paso a paso de las actividades, incluyendo preguntas socráticas y dinámicas de motivación)"
    },
    {
      "fase": "DESARROLLO",
      "duracion": "String (ej: 60 min)",
      "actividades": "String (descripción detallada de actividades principales, trabajo individual/grupal, rol del docente)"
    },
    {
      "fase": "CIERRE",
      "duracion": "String (ej: 15 min)",
      "actividades": "String (metacognición, reflexión, extensión para casa si aplica)"
    }
  ],
  "adaptaciones_sugeridas": {
    "estrategias_diferenciadas": "String (estrategias específicas para los tipos de NEE indicados)"
  }
}

### FILOSOFÍA PEDAGÓGICA:
- INICIO: Conexión emocional + activación de saberes previos + propósito claro
- DESARROLLO: Reto cognitivo + trabajo colaborativo + andamiaje progresivo
- CIERRE: Metacognición (¿qué aprendí? ¿cómo lo aprendí? ¿para qué me sirve?)`;

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

    // Parse the JSON response - handle markdown code blocks
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
      
      guiaData = JSON.parse(jsonContent);
      console.log("JSON parsed successfully");
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      throw new Error("La respuesta de la IA no es un JSON válido");
    }

    // Ensure required fields exist with defaults based on new schema
    // Normalize propositos_aprendizaje to ensure criterios_evaluacion is always an array
    const normalizedPropositos = (guiaData.propositos_aprendizaje || []).map((p: any) => ({
      ...p,
      criterios_evaluacion: Array.isArray(p.criterios_evaluacion) 
        ? p.criterios_evaluacion 
        : [p.criterios_evaluacion || "Desempeño por definir"]
    }));

    // Build default propositos from competenciasConDesempenos if AI didn't return any
    const defaultPropositos = competenciasConDesempenos && competenciasConDesempenos.length > 0
      ? competenciasConDesempenos.map(item => ({
          competencia: item.competencia,
          criterios_evaluacion: item.desempenos.length > 0 ? item.desempenos : ["Desempeño por definir"],
          evidencia_aprendizaje: "Producto o actuación observable",
          instrumento_valoracion: "Lista de cotejo"
        }))
      : [{
          competencia: "[POR DEFINIR]",
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
