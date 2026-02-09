/**
 * AI Integration Module
 * 
 * This module provides functions for AI-powered generation of:
 * - Class guides (guías de clase)
 * - Master guides (guías maestras)
 * 
 * Uses Supabase Edge Functions for real AI generation.
 */

import { supabase } from '@/integrations/supabase/client';

// New schema aligned with CNEB MINEDU format - CognitIA v3.0
export interface GuiaClaseData {
  datos_generales: {
    titulo_sesion: string;
    nivel: string;
    grado: string;
    area_academica: string;
    duracion: string;
  };
  // Situación significativa como string único (párrafo narrativo) o objeto legacy
  situacion_significativa?: string | {
    contexto: string;
    reto: string;
    producto: string;
  };
  propositos_aprendizaje: Array<{
    competencia: string;
    capacidades?: string[];
    criterios_evaluacion: string[];
    evidencia_aprendizaje: string;
    instrumento_valoracion: string;
  }>;
  enfoques_transversales: Array<{
    nombre: string;
    descripcion: string;
    valor?: string;
    actitud_docente?: string;
    actitud_estudiante?: string;
  }>;
  preparacion: {
    antes_sesion: string;
    materiales: string[];
  };
  momentos_sesion: Array<{
    fase: 'INICIO' | 'DESARROLLO' | 'CIERRE';
    duracion: string;
    organizacion?: string; // "En grupo clase", "Individual", "En parejas", "En equipos de X"
    // NEW: Texto narrativo extenso en segunda persona (formato guión)
    narrativa_docente?: string;
    // Legacy fields for backward compatibility
    actividades: string;
    objetivo_fase?: string;
    actividades_docente?: string[];
    actividades_estudiante?: string[];
    // CognitIA fields for INICIO
    estrategia_motivacion?: {
      tipo: string;
      descripcion: string;
    };
    conflicto_cognitivo?: string;
    conexion_saberes_previos?: string;
    proposito_comunicado?: string;
    consigna_textual?: string;
    // CognitIA fields for DESARROLLO
    metodologia_activa?: {
      nombre: string;
      justificacion: string;
    };
    fases_desarrollo?: Array<{
      nombre: string;
      duracion: string;
      organizacion?: string;
      consigna_textual?: string;
      actividades_docente: string[];
      actividades_estudiante: string[];
      producto_parcial?: string;
      roles_cooperativos?: Array<{
        rol: string;
        responsabilidad: string;
      }>;
    }>;
    retroalimentacion_formativa?: {
      preguntas_sondeo: string[];
      gestion_error: string;
    };
    // CognitIA fields for CIERRE
    socializacion?: {
      estrategia: string;
      descripcion: string;
    };
    metacognicion?: {
      estrategia: string;
      preguntas: string[];
    };
    verificacion_proposito?: string;
  }>;
  adaptaciones_sugeridas?: {
    estrategias_diferenciadas: string;
    por_tipo_nee?: Array<{
      tipo: string;
      en_inicio: string;
      en_desarrollo: string;
      en_cierre: string;
    }>;
    apoyo_adicional?: string[];
    extension_avanzados?: string[];
    recursos_apoyo?: string[];
  };
}

export interface CompetenciaConDesempenos {
  competencia: string;
  capacidades: string[];
  desempenos: string[];
}

export interface GenerateGuiaClaseInput {
  tema: string;
  contexto: string;
  recursos?: string[];
  grado?: string;
  nivel?: string;
  seccion?: string;
  numeroEstudiantes?: number;
  duracion?: number;
  area?: string;
  // CNEB fields - NEW STRUCTURE
  competenciasConDesempenos?: CompetenciaConDesempenos[];
  enfoquesTransversales?: string[];
  adaptaciones?: string[];
  adaptacionesPersonalizadas?: string;
  materiales?: string[];
}

/**
 * Generates a class guide using AI via Supabase Edge Function
 * 
 * @param tema - Topic name
 * @param contexto - Context about the class/group
 * @param recursos - Available resources
 * @param opciones - Optional additional context (grado, seccion, etc.)
 * @returns Generated guide data aligned with CNEB
 */
export async function generateGuiaClase(
  tema: string,
  contexto: string,
  recursos: string[],
  opciones?: {
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
): Promise<GuiaClaseData> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-guia-clase', {
      body: {
        tema,
        contexto,
        recursos: recursos || [],
        grado: opciones?.grado,
        nivel: opciones?.nivel,
        seccion: opciones?.seccion,
        numeroEstudiantes: opciones?.numeroEstudiantes,
        duracion: opciones?.duracion,
        area: opciones?.area,
        competenciasConDesempenos: opciones?.competenciasConDesempenos,
        enfoquesTransversales: opciones?.enfoquesTransversales,
        adaptaciones: opciones?.adaptaciones,
        adaptacionesPersonalizadas: opciones?.adaptacionesPersonalizadas,
        materiales: opciones?.materiales
      }
    });

    if (error) {
      console.error('Error calling generate-guia-clase:', error);
      throw new Error(error.message || 'Error al generar la guía');
    }

    // Check if the response contains an error
    if (data?.error) {
      throw new Error(data.error);
    }

    return data as GuiaClaseData;
  } catch (error) {
    console.error('Error in generateGuiaClase:', error);
    throw error; // Re-throw to let UI handle the error
  }
}

// ============================================================================
// GUÍA MAESTRA (Tema Level)
// ============================================================================

export interface ClaseEstructura {
  numero: number;
  nombre: string;
  descripcion: string;
  duracion_sugerida: number; // minutos
}

export interface GuiaMaestraData {
  objetivos_generales: string;
  estructura_sesiones: ClaseEstructura[];
  recursos_recomendados: string[];
  metodologias: string[];
  estrategias_evaluacion: string[];
  actividades_transversales: string[];
  competencias: string[];
}

export interface GenerateGuiaMaestraInput {
  tema: {
    nombre: string;
    descripcion?: string;
    objetivos?: string;
    duracion_estimada?: number;
  };
  curso: {
    nombre: string;
    grado: string;
  };
  contextoGrupo: string;
  metodologiasPreferidas: string[];
  totalClases: number;
}

/**
 * Generates a complete master guide (Guía Maestra) for a topic using AI
 * 
 * @param input - Topic, course, context and preferences
 * @returns Generated master guide data with objectives, class structure, resources, etc.
 */
export async function generateGuiaMaestra(
  input: GenerateGuiaMaestraInput
): Promise<GuiaMaestraData> {
  // TODO: Replace with actual AI API call
  
  await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate API delay

  const { tema, curso, contextoGrupo, metodologiasPreferidas, totalClases } = input;

  // Generate objectives based on topic
  const objetivos_generales = `Al finalizar el tema, los estudiantes serán capaces de ${tema.objetivos || `comprender, aplicar y analizar los conceptos fundamentales de ${tema.nombre}`}. Se busca desarrollar el pensamiento crítico y la capacidad de resolver problemas relacionados con ${tema.nombre} en contextos reales y significativos para estudiantes de ${curso.grado}.`;

  // Generate class structure based on totalClases
  const estructura_sesiones: ClaseEstructura[] = [];
  
  // Define typical class progression patterns
  const clasesPatrones = [
    { tipo: 'introduccion', prefijo: 'Explorando', sufijo: 'conceptos básicos' },
    { tipo: 'desarrollo', prefijo: 'Práctica de', sufijo: 'con ejercicios' },
    { tipo: 'profundizacion', prefijo: 'Profundizando en', sufijo: 'y casos especiales' },
    { tipo: 'aplicacion', prefijo: 'Aplicando', sufijo: 'en situaciones reales' },
    { tipo: 'integracion', prefijo: 'Integrando', sufijo: 'con otros conceptos' },
    { tipo: 'evaluacion', prefijo: 'Evaluación y repaso:', sufijo: '' },
  ];

  for (let i = 1; i <= totalClases; i++) {
    const patronIndex = Math.min(i - 1, clasesPatrones.length - 1);
    const patron = clasesPatrones[patronIndex % clasesPatrones.length];
    
    let nombre: string;
    let descripcion: string;
    
    if (i === 1) {
      nombre = `Introducción a ${tema.nombre}`;
      descripcion = `Presentación del tema y activación de conocimientos previos. Exploración inicial de ${tema.nombre} mediante preguntas guiadas y ejemplos contextualizados.`;
    } else if (i === totalClases) {
      nombre = `Evaluación y consolidación: ${tema.nombre}`;
      descripcion = `Repaso general de los conceptos trabajados. Evaluación formativa y juego interactivo para consolidar los aprendizajes.`;
    } else {
      nombre = `${patron.prefijo} ${tema.nombre.split(' ').slice(0, 3).join(' ')} ${patron.sufijo}`.trim();
      descripcion = `Desarrollo de actividades prácticas relacionadas con ${tema.nombre}. ${
        metodologiasPreferidas.includes('colaborativo') 
          ? 'Trabajo en equipos pequeños.' 
          : 'Práctica individual guiada.'
      } Uso de materiales concretos y recursos visuales.`;
    }

    estructura_sesiones.push({
      numero: i,
      nombre,
      descripcion,
      duracion_sugerida: 60
    });
  }

  // Generate resources based on topic and grade
  const recursos_recomendados = [
    `Material concreto (manipulativos relacionados con ${tema.nombre})`,
    'Tarjetas didácticas con ejemplos visuales',
    `Fichas de trabajo con ejercicios graduados`,
    'Videos educativos cortos sobre el tema',
    'Aplicaciones y juegos interactivos (Gamificación)',
    'Recursos digitales para pizarra interactiva',
    'Material para trabajo colaborativo',
    `Guías de evaluación formativa`
  ];

  // Map methodology IDs to full names
  const metodologiasNombres: Record<string, string> = {
    'socratico': 'Método Socrático',
    'casos': 'Aprendizaje basado en casos',
    'problemas': 'Aprendizaje basado en problemas',
    'colaborativo': 'Aprendizaje colaborativo',
    'reflexivo': 'Pensamiento reflexivo',
    'flipped': 'Clase Invertida (Flipped Classroom)',
    'gamificacion': 'Gamificación',
    'descubrimiento': 'Aprendizaje por Descubrimiento'
  };

  const metodologias = metodologiasPreferidas.length > 0
    ? metodologiasPreferidas.map(m => metodologiasNombres[m] || m)
    : ['Aprendizaje activo', 'Trabajo colaborativo', 'Evaluación formativa'];

  // Generate evaluation strategies
  const estrategias_evaluacion = [
    'Observación directa de la participación y manipulación de materiales durante las actividades.',
    'Registro de avances en fichas de trabajo individuales.',
    'Evaluaciones formativas mediante juegos y actividades interactivas.',
    'Resolución de problemas de aplicación contextualizada.',
    'Portafolio de evidencias con trabajos seleccionados.',
    'Rúbricas de evaluación para habilidades de comunicación y razonamiento.',
    'Quizzes interactivos cortos (evaluación diagnóstica y sumativa).'
  ];

  // Generate cross-curricular activities
  const actividades_transversales = [
    `Conexión con lectura: Cuentos o textos relacionados con ${tema.nombre}.`,
    'Proyecto integrador con otras áreas del conocimiento.',
    'Actividades de expresión artística relacionadas con el tema.',
    'Juegos de mesa educativos que refuercen los conceptos.',
    'Vinculación con situaciones de la vida cotidiana.',
    'Trabajo con tecnología: uso de apps educativas.',
    'Actividades de comunicación oral: exposiciones breves.'
  ];

  // Generate competencies
  const competencias = [
    `Comprende y aplica conceptos de ${tema.nombre}.`,
    'Comunica su comprensión sobre los conceptos trabajados.',
    'Usa estrategias y procedimientos para resolver problemas.',
    'Argumenta afirmaciones sobre las relaciones y operaciones.',
    'Desarrolla pensamiento crítico y reflexivo.'
  ];

  return {
    objetivos_generales,
    estructura_sesiones,
    recursos_recomendados,
    metodologias,
    estrategias_evaluacion,
    actividades_transversales,
    competencias
  };
}

