import type { GradoInfo, FormData, FormSectionProgress, GrupoData } from './types';

// Helper to parse grade info from group data
export const parseGradoFromGrupo = (grupo: { grado: string; seccion?: string | null }): GradoInfo => {
  const match = grupo.grado.match(/^(\d+)°?\s*(Primaria|Secundaria)/i);
  if (match) {
    return {
      gradoNum: match[1],
      nivel: match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase(),
      gradoCompleto: `${match[1]}° ${match[2]}`
    };
  }
  return { gradoNum: '', nivel: '', gradoCompleto: grupo.grado };
};

// Format date for display
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Sin fecha';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Get estado label for display
export const getEstadoLabel = (estado: string): string => {
  const labels: Record<string, string> = {
    borrador: 'GUÍA PENDIENTE',
    generando_clase: 'generando clase',
    editando_guia: 'editando guía',
    guia_aprobada: 'guía aprobada',
    clase_programada: 'programada'
  };
  return labels[estado] || estado;
};

// Calculate form section progress
export const calculateSectionProgress = (
  formData: FormData,
  isExtraordinaria: boolean,
  temaData: any,
  grupoData: GrupoData | null
): FormSectionProgress => {
  // Datos section
  const datosFields = [
    isExtraordinaria ? formData.temaPersonalizado.trim() : temaData?.id,
    grupoData?.id,
    formData.fecha,
    formData.areaAcademica
  ];
  const datosCompleted = datosFields.filter(Boolean).length;

  // Propósitos section
  const hasCompetencias = formData.competencias.length > 0;
  const hasCapacidades = formData.competencias.some(
    compId => (formData.capacidadesPorCompetencia[compId] || []).length > 0
  );
  const hasDesempenos = formData.competencias.some(
    compId => (formData.desempenosPorCompetencia[compId] || []).some(d => d.trim() !== '')
  );
  const hasEnfoque = !!formData.enfoqueTransversal;
  
  const propositosFields = [hasCompetencias, hasCapacidades, hasDesempenos, hasEnfoque];
  const propositosCompleted = propositosFields.filter(Boolean).length;

  // Materiales section
  const hasMateriales = formData.materiales.length > 0;
  const materialesCompleted = hasMateriales ? 1 : 0;

  // Adaptaciones section (optional, always complete)
  const adaptacionesCompleted = 1;

  return {
    datos: {
      name: 'Datos',
      completed: datosCompleted,
      total: 4,
      isComplete: datosCompleted === 4
    },
    propositos: {
      name: 'Propósitos',
      completed: propositosCompleted,
      total: 4,
      isComplete: propositosCompleted === 4
    },
    materiales: {
      name: 'Materiales',
      completed: materialesCompleted,
      total: 1,
      isComplete: materialesCompleted === 1
    },
    adaptaciones: {
      name: 'Adaptaciones',
      completed: adaptacionesCompleted,
      total: 1,
      isComplete: true // Always complete as it's optional
    }
  };
};

// Get missing required fields
export const getMissingFields = (
  formData: FormData,
  isExtraordinaria: boolean,
  temaData: any,
  grupoData: GrupoData | null
): string[] => {
  const missing: string[] = [];
  
  // Tema
  if (isExtraordinaria) {
    if (!formData.temaPersonalizado.trim()) missing.push('Tema');
  } else {
    if (!temaData?.id) missing.push('Tema');
  }
  
  if (!grupoData) missing.push('Grupo');
  if (!formData.fecha) missing.push('Fecha programada');
  if (!formData.areaAcademica) missing.push('Área Académica');
  if (formData.competencias.length === 0) missing.push('Al menos una Competencia');
  
  // Check that each competencia has at least one capacidad and one desempeño
  const competenciasConCapacidades = formData.competencias.filter(
    compId => (formData.capacidadesPorCompetencia[compId] || []).length > 0
  );
  if (competenciasConCapacidades.length === 0) missing.push('Al menos una Capacidad por Competencia');
  
  const competenciasConDesempenos = formData.competencias.filter(
    compId => (formData.desempenosPorCompetencia[compId] || []).some(d => d.trim() !== '')
  );
  if (competenciasConDesempenos.length === 0) missing.push('Al menos un Desempeño por Competencia');
  if (!formData.enfoqueTransversal) missing.push('Enfoque Transversal');
  if (formData.materiales.length === 0) missing.push('Al menos un Material');
  
  return missing;
};

// Get initial form state
export const getInitialFormData = (): FormData => ({
  fecha: '',
  duracion: 55,
  areaAcademica: '',
  competencias: [],
  capacidadesPorCompetencia: {},
  desempenosPorCompetencia: {},
  enfoqueTransversal: '',
  materiales: [],
  materialOtro: '',
  adaptaciones: [],
  adaptacionesPersonalizadas: '',
  contexto: '',
  temaPersonalizado: ''
});

// Format relative time for "saved X ago"
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  
  if (diffSecs < 60) {
    return 'hace unos segundos';
  } else if (diffMins < 60) {
    return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  } else {
    const diffHours = Math.floor(diffMins / 60);
    return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  }
};
