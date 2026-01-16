// Types for GenerarClase form and wizard

export interface FormData {
  fecha: string;
  duracion: number;
  areaAcademica: string;
  // Propósitos de aprendizaje
  competencias: string[];
  capacidadesPorCompetencia: Record<string, string[]>;
  desempenosPorCompetencia: Record<string, string[]>;
  enfoqueTransversal: string;
  // Materiales
  materiales: string[];
  materialOtro: string;
  // Adaptaciones
  adaptaciones: string[];
  adaptacionesPersonalizadas: string;
  // Legacy/Extraordinaria
  contexto: string;
  temaPersonalizado: string;
}

export interface GradoInfo {
  gradoNum: string;
  nivel: string;
  gradoCompleto: string;
}

export interface TemaData {
  id: string;
  nombre: string;
  curso_plan_id?: string;
  [key: string]: any;
}

export interface CursoData {
  id: string;
  nombre: string;
  [key: string]: any;
}

export interface GrupoData {
  id: string;
  nombre?: string;
  grado: string;
  seccion?: string | null;
  cantidad_alumnos?: number | null;
}

export interface WizardStep {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface MaterialDisponible {
  id: string;
  nombre: string;
}

export interface HoraPedagogicaOption {
  horas: number;
  minutos: number;
}

export type ViewMode = 'selection' | 'wizard';

// Section completion status for progress indicators
export interface SectionStatus {
  name: string;
  completed: number;
  total: number;
  isComplete: boolean;
}

export interface FormSectionProgress {
  datos: SectionStatus;
  propositos: SectionStatus;
  materiales: SectionStatus;
  adaptaciones: SectionStatus;
}
