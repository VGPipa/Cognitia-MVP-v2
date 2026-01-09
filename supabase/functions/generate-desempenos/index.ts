import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Eres un experto en el Currículo Nacional de Educación Básica (CNEB) del Perú.

Tu tarea es generar DESEMPEÑOS DE APRENDIZAJE precisos y específicos para una sesión de clase.

Los desempeños deben:
1. Ser observables y medibles
2. Usar verbos en tercera persona singular (el estudiante identifica, analiza, produce...)
3. Estar alineados con las competencias y capacidades del CNEB proporcionadas
4. Ser apropiados para el grado/nivel indicado
5. Ser específicos para el tema de la sesión
6. Incluir el contexto o producto esperado

Genera entre 2 y 4 desempeños específicos.

IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional ni markdown.

Formato exacto de respuesta:
{
  "desempenos": [
    "El estudiante identifica...",
    "El estudiante analiza...",
    "El estudiante produce..."
  ],
  "desempenoUnificado": "El estudiante identifica... Además, analiza... para producir..."
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Updated to accept single competencia instead of array
    const { tema, nivel, grado, area, competencia, capacidades } = await req.json();

    console.log('Generating desempeños for:', { tema, nivel, grado, area, competencia, capacidades });

    if (!tema || !competencia || !capacidades?.length) {
      return new Response(
        JSON.stringify({ error: 'Se requiere tema, competencia y capacidades' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const userPrompt = `Genera desempeños de aprendizaje para la siguiente sesión de clase:

TEMA: ${tema}
NIVEL: ${nivel}
GRADO: ${grado}°
ÁREA CURRICULAR: ${area}

COMPETENCIA:
${competencia}

CAPACIDADES SELECCIONADAS:
${capacidades.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

Genera 2-3 desempeños específicos, observables y medibles que el estudiante debe lograr al finalizar la sesión, basados en esta competencia y sus capacidades.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido, intenta de nuevo más tarde' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos insuficientes para la generación con IA' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI response:', content);

    // Parse JSON response
    let parsed;
    try {
      // Clean up potential markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: extract text and create simple response
      parsed = {
        desempenos: [content.substring(0, 500)],
        desempenoUnificado: content.substring(0, 500)
      };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-desempenos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
