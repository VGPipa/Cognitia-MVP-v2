import { BookOpen, Sparkles, FileCheck } from 'lucide-react';
import type { WizardStep, MaterialDisponible, HoraPedagogicaOption } from './types';

// Wizard steps - simplified to 3 steps
export const STEPS: WizardStep[] = [
  { id: 1, title: 'Contexto', icon: BookOpen },
  { id: 2, title: 'Guía de Clase', icon: Sparkles },
  { id: 3, title: 'Validar', icon: FileCheck }
];

export const MATERIALES_DISPONIBLES: MaterialDisponible[] = [
  { id: 'computadoras', nombre: 'Computadoras' },
  { id: 'proyector', nombre: 'Proyector / TV' },
  { id: 'patio', nombre: 'Patio / espacio libre' },
  { id: 'material_impreso', nombre: 'Material impreso' },
  { id: 'celular', nombre: 'Computador / Celular' }
];

// Horas pedagógicas (1 hora = 45 minutos)
export const HORAS_PEDAGOGICAS: HoraPedagogicaOption[] = [
  { horas: 1, minutos: 45 },
  { horas: 2, minutos: 90 },
  { horas: 3, minutos: 135 },
  { horas: 4, minutos: 180 },
  { horas: 5, minutos: 225 }
];

// LocalStorage keys
export const STORAGE_KEYS = {
  LAST_AREA: 'generar_clase_last_area',
  LAST_MATERIALES: 'generar_clase_last_materiales'
};

// Estado labels for display
export const ESTADO_LABELS: Record<string, string> = {
  borrador: 'GUÍA PENDIENTE',
  generando_clase: 'generando clase',
  editando_guia: 'editando guía',
  guia_aprobada: 'guía aprobada',
  clase_programada: 'programada'
};
