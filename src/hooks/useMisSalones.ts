import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfesor } from './useProfesor';

// Cache times for React Query
const STALE_TIME = 5 * 60 * 1000; // 5 minutos
const GC_TIME = 10 * 60 * 1000; // 10 minutos

// Tipos para las métricas del salón
export interface ResumenSalon {
  participacion: number;
  alumnosRequierenRefuerzo: number;
  porcentajeRefuerzo: number;
  desempeno: number;
}

export interface GrupoConMetricas {
  id: string;
  nombre: string;
  grado: string;
  seccion: string | null;
  cantidadAlumnos: number;
}

export interface AsignacionConMetricas {
  id: string;
  materia: { id: string; nombre: string };
  grupo: { id: string; nombre: string; grado: string; seccion: string | null; cantidad_alumnos: number };
  promedio: number;
  totalQuizzes: number;
  asistencia: number;
}

export interface MetricasGlobales {
  promedioGeneral: number;
  totalAlumnos: number;
  participacion: number;
}

// Hook para obtener métricas globales del profesor
export function useMetricasGlobalesProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['metricas-globales-profesor', profesor?.id],
    queryFn: async (): Promise<MetricasGlobales> => {
      if (!profesor?.id) {
        return { promedioGeneral: 0, totalAlumnos: 0, participacion: 0 };
      }

      // Get classes for this teacher
      const { data: clases, error } = await supabase
        .from('clases')
        .select('id, id_grupo')
        .eq('id_profesor', profesor.id);

      if (error) throw error;

      // Get unique groups
      const grupoIds = [...new Set(clases?.map(c => c.id_grupo) || [])];
      
      if (grupoIds.length === 0) {
        return { promedioGeneral: 0, totalAlumnos: 0, participacion: 0 };
      }

      // Count students across groups
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select('id_alumno')
        .in('id_grupo', grupoIds);

      const totalAlumnos = new Set(alumnosGrupo?.map(a => a.id_alumno) || []).size;

      return {
        promedioGeneral: 0,
        totalAlumnos,
        participacion: 0,
      };
    },
    enabled: !!profesor?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener las asignaciones del profesor con métricas
export function useAsignacionesProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['asignaciones-profesor-metricas', profesor?.id],
    queryFn: async (): Promise<AsignacionConMetricas[]> => {
      if (!profesor?.id) return [];

      const { data: asignaciones, error } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id,
          id_grupo,
          id_materia,
          grupos (
            id,
            nombre,
            grado,
            seccion,
            cantidad_alumnos
          ),
          cursos_plan (
            id,
            nombre
          )
        `)
        .eq('id_profesor', profesor.id);

      if (error) throw error;
      if (!asignaciones || asignaciones.length === 0) return [];

      return asignaciones.map(asig => {
        const grupo = asig.grupos as any;
        const materia = asig.cursos_plan as any;
        
        if (!grupo || !materia) return null;

        return {
          id: asig.id,
          materia: { id: materia.id, nombre: materia.nombre },
          grupo: { 
            id: grupo.id, 
            nombre: grupo.nombre, 
            grado: grupo.grado, 
            seccion: grupo.seccion, 
            cantidad_alumnos: grupo.cantidad_alumnos || 0 
          },
          promedio: 0,
          totalQuizzes: 0,
          asistencia: 0,
        };
      }).filter(Boolean) as AsignacionConMetricas[];
    },
    enabled: !!profesor?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener los grupos/salones asignados al profesor
export function useGruposProfesor() {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['grupos-profesor', profesor?.id],
    queryFn: async () => {
      if (!profesor?.id) return [];

      const { data, error } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id_grupo,
          grupos (
            id,
            nombre,
            grado,
            seccion,
            cantidad_alumnos
          )
        `)
        .eq('id_profesor', profesor.id);

      if (error) throw error;

      const gruposUnicos = new Map<string, GrupoConMetricas>();
      data?.forEach((asig) => {
        const grupo = asig.grupos as any;
        if (grupo && !gruposUnicos.has(grupo.id)) {
          gruposUnicos.set(grupo.id, {
            id: grupo.id,
            nombre: grupo.nombre,
            grado: grupo.grado,
            seccion: grupo.seccion,
            cantidadAlumnos: grupo.cantidad_alumnos || 0,
          });
        }
      });

      return Array.from(gruposUnicos.values());
    },
    enabled: !!profesor?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener las materias de un grupo específico
export function useMateriasGrupo(grupoId: string | null) {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['materias-grupo', grupoId, profesor?.id],
    queryFn: async () => {
      if (!grupoId || !profesor?.id) return [];

      const { data, error } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id_materia,
          cursos_plan (
            id,
            nombre
          )
        `)
        .eq('id_profesor', profesor.id)
        .eq('id_grupo', grupoId);

      if (error) throw error;

      return data?.map((asig) => {
        const curso = asig.cursos_plan as any;
        return {
          id: curso?.id || asig.id_materia,
          nombre: curso?.nombre || 'Sin nombre',
        };
      }) || [];
    },
    enabled: !!grupoId && !!profesor?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener los temas de una materia
export function useTemasMateria(materiaId: string | null) {
  return useQuery({
    queryKey: ['temas-materia', materiaId],
    queryFn: async () => {
      if (!materiaId) return [];

      const { data, error } = await supabase
        .from('temas_plan')
        .select('id, nombre, orden')
        .eq('curso_plan_id', materiaId)
        .order('orden');

      if (error) throw error;
      return data || [];
    },
    enabled: !!materiaId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener las clases/sesiones de un tema
export function useClasesTema(temaId: string | null, grupoId: string | null) {
  const { profesor } = useProfesor();

  return useQuery({
    queryKey: ['clases-tema', temaId, grupoId, profesor?.id],
    queryFn: async () => {
      if (!temaId || !profesor?.id) return [];

      const { data: guiaTema, error: guiaError } = await supabase
        .from('guias_tema')
        .select('id, estructura_sesiones, total_sesiones')
        .eq('id_tema', temaId)
        .eq('id_profesor', profesor.id)
        .maybeSingle();

      if (guiaError) throw guiaError;

      if (guiaTema?.estructura_sesiones && Array.isArray(guiaTema.estructura_sesiones)) {
        const sesiones = guiaTema.estructura_sesiones as Array<{ numero?: number; nombre?: string }>;
        
        const { data: clasesExistentes } = await supabase
          .from('clases')
          .select('id, numero_sesion, fecha_programada, estado')
          .eq('id_tema', temaId)
          .eq('id_profesor', profesor.id)
          .order('numero_sesion');

        return sesiones.map((sesion, index) => {
          const numeroSesion = sesion.numero || index + 1;
          const claseExistente = clasesExistentes?.find(c => c.numero_sesion === numeroSesion);
          
          return {
            id: claseExistente?.id || `virtual-${numeroSesion}`,
            numero_sesion: numeroSesion,
            fecha_programada: claseExistente?.fecha_programada || null,
            estado: claseExistente?.estado || 'borrador',
            nombre: sesion.nombre || `Clase ${numeroSesion}`,
            es_virtual: !claseExistente
          };
        });
      }

      const { data, error } = await supabase
        .from('clases')
        .select('id, numero_sesion, fecha_programada, estado')
        .eq('id_tema', temaId)
        .eq('id_profesor', profesor.id)
        .order('numero_sesion');

      if (error) throw error;
      return (data || []).map(c => ({
        ...c,
        nombre: `Clase ${c.numero_sesion || 1}`,
        es_virtual: false
      }));
    },
    enabled: !!temaId && !!profesor?.id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Hook para obtener el resumen del salón
export function useResumenSalon(grupoId: string | null, filtros?: { materiaId?: string; temaId?: string; claseId?: string }) {
  return useQuery({
    queryKey: ['resumen-salon', grupoId, filtros],
    queryFn: async (): Promise<ResumenSalon> => {
      if (!grupoId) {
        return { participacion: 0, alumnosRequierenRefuerzo: 0, porcentajeRefuerzo: 0, desempeno: 0 };
      }

      const { data: alumnosGrupo, error: errorAlumnos } = await supabase
        .from('alumnos_grupo')
        .select('id_alumno')
        .eq('id_grupo', grupoId);

      if (errorAlumnos) throw errorAlumnos;
      const totalAlumnos = alumnosGrupo?.length || 0;

      return {
        participacion: 0,
        alumnosRequierenRefuerzo: 0,
        porcentajeRefuerzo: 0,
        desempeno: 0,
      };
    },
    enabled: !!grupoId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}
