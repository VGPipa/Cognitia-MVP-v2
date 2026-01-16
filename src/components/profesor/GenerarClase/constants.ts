import { BookOpen, Sparkles, FileCheck } from 'lucide-react';
import type { WizardStep, MaterialDisponible, DuracionOption } from './types';

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

export const DURACIONES: DuracionOption[] = [
  { value: 45, label: '45 minutos' },
  { value: 55, label: '55 minutos' },
  { value: 60, label: '60 minutos' },
  { value: 90, label: '90 minutos' }
];

// Auto-save interval in milliseconds
export const AUTOSAVE_INTERVAL = 30000; // 30 seconds

// LocalStorage keys
export const STORAGE_KEYS = {
  DRAFT_FORM: 'generar_clase_draft_form',
  DRAFT_TIMESTAMP: 'generar_clase_draft_timestamp',
  DRAFT_DISMISSED: 'generar_clase_draft_dismissed',
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
