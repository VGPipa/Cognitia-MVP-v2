import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { FormData, GrupoData, GradoInfo } from '@/components/profesor/GenerarClase/types';
import { getInitialFormData, getMissingFields, calculateSectionProgress } from '@/components/profesor/GenerarClase/utils';

interface UseGenerarClaseFormProps {
  areas: Array<{ id: string; nombre: string }>;
  competenciasCNEB: Array<{ id: string; nombre: string }>;
  capacidadesCNEB: Array<{ id: string; nombre: string; id_competencia: string }>;
  gradoInfo: GradoInfo | null;
  isClaseCompletada: boolean;
}

export function useGenerarClaseForm({
  areas,
  competenciasCNEB,
  capacidadesCNEB,
  gradoInfo,
  isClaseCompletada
}: UseGenerarClaseFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  const [generatingForCompetencia, setGeneratingForCompetencia] = useState<string | null>(null);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData(getInitialFormData());
  }, []);

  // Set form data (for loading from DB or restoring draft)
  const setFormValues = useCallback((values: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...values }));
  }, []);

  // Update a single field
  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    if (isClaseCompletada) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  }, [isClaseCompletada]);

  // Toggle competencia selection
  const toggleCompetencia = useCallback((competenciaId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => {
      const isSelected = prev.competencias.includes(competenciaId);
      
      if (isSelected) {
        // Remove competencia and its capacidades/desempeños
        const { [competenciaId]: removedCaps, ...restCaps } = prev.capacidadesPorCompetencia;
        const { [competenciaId]: removedDesempenos, ...restDesempenos } = prev.desempenosPorCompetencia;
        
        return {
          ...prev,
          competencias: prev.competencias.filter(id => id !== competenciaId),
          capacidadesPorCompetencia: restCaps,
          desempenosPorCompetencia: restDesempenos
        };
      } else {
        // Add competencia
        return {
          ...prev,
          competencias: [...prev.competencias, competenciaId],
          capacidadesPorCompetencia: {
            ...prev.capacidadesPorCompetencia,
            [competenciaId]: []
          },
          desempenosPorCompetencia: {
            ...prev.desempenosPorCompetencia,
            [competenciaId]: []
          }
        };
      }
    });
  }, [isClaseCompletada]);

  // Toggle capacidad for a specific competencia
  const toggleCapacidadForCompetencia = useCallback((competenciaId: string, capacidadId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => {
      const currentCaps = prev.capacidadesPorCompetencia[competenciaId] || [];
      const newCaps = currentCaps.includes(capacidadId)
        ? currentCaps.filter(id => id !== capacidadId)
        : [...currentCaps, capacidadId];
      
      return {
        ...prev,
        capacidadesPorCompetencia: {
          ...prev.capacidadesPorCompetencia,
          [competenciaId]: newCaps
        }
      };
    });
  }, [isClaseCompletada]);

  // Update desempeño text for a competencia
  const updateDesempenoForCompetencia = useCallback((competenciaId: string, index: number, value: string) => {
    setFormData(prev => {
      const currentDesempenos = [...(prev.desempenosPorCompetencia[competenciaId] || [])];
      currentDesempenos[index] = value;
      return {
        ...prev,
        desempenosPorCompetencia: {
          ...prev.desempenosPorCompetencia,
          [competenciaId]: currentDesempenos
        }
      };
    });
  }, []);

  // Add new desempeño for a competencia
  const addDesempenoForCompetencia = useCallback((competenciaId: string) => {
    setFormData(prev => ({
      ...prev,
      desempenosPorCompetencia: {
        ...prev.desempenosPorCompetencia,
        [competenciaId]: [...(prev.desempenosPorCompetencia[competenciaId] || []), '']
      }
    }));
  }, []);

  // Remove desempeño from a competencia
  const removeDesempenoFromCompetencia = useCallback((competenciaId: string, index: number) => {
    setFormData(prev => {
      const currentDesempenos = [...(prev.desempenosPorCompetencia[competenciaId] || [])];
      currentDesempenos.splice(index, 1);
      return {
        ...prev,
        desempenosPorCompetencia: {
          ...prev.desempenosPorCompetencia,
          [competenciaId]: currentDesempenos
        }
      };
    });
  }, []);

  // Get capacidades for a specific competencia
  const getCapacidadesForCompetencia = useCallback((competenciaId: string) => {
    return capacidadesCNEB.filter(cap => cap.id_competencia === competenciaId);
  }, [capacidadesCNEB]);

  // Generate desempeños for a specific competencia
  const handleGenerarDesempenoParaCompetencia = useCallback(async (
    competenciaId: string,
    temaData: any,
    temaPersonalizado: string
  ) => {
    const temaNombre = temaPersonalizado?.trim() || temaData?.nombre?.trim() || '';
    
    if (!temaNombre) {
      toast({
        title: 'Tema requerido',
        description: 'Ingresa o selecciona un tema antes de generar desempeños',
        variant: 'destructive'
      });
      return;
    }
    
    const capacidadesDeCompetencia = formData.capacidadesPorCompetencia[competenciaId] || [];
    
    if (capacidadesDeCompetencia.length === 0) {
      toast({
        title: 'Selección requerida',
        description: 'Selecciona al menos una capacidad para esta competencia',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingForCompetencia(competenciaId);
    
    try {
      const areaName = areas.find(a => a.id === formData.areaAcademica)?.nombre || '';
      const competenciaData = competenciasCNEB.find(c => c.id === competenciaId);
      const capacidadesNames = capacidadesDeCompetencia
        .map(id => capacidadesCNEB.find(c => c.id === id)?.nombre)
        .filter(Boolean);

      const response = await supabase.functions.invoke('generate-desempenos', {
        body: {
          tema: temaNombre,
          nivel: gradoInfo?.nivel || 'Secundaria',
          grado: gradoInfo?.gradoNum || '3',
          area: areaName,
          competencia: competenciaData?.nombre || '',
          capacidades: capacidadesNames
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      const desempenos = data.desempenos || [data.desempenoUnificado || ''];
      
      setFormData(prev => ({
        ...prev,
        desempenosPorCompetencia: {
          ...prev.desempenosPorCompetencia,
          [competenciaId]: desempenos
        }
      }));

      toast({
        title: 'Desempeños generados',
        description: `Se generaron ${desempenos.length} desempeño(s) para esta competencia`
      });
    } catch (error: any) {
      console.error('Error generating desempeno:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar los desempeños. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingForCompetencia(null);
    }
  }, [formData, areas, competenciasCNEB, capacidadesCNEB, gradoInfo, toast]);

  // Toggle material selection
  const toggleMaterial = useCallback((materialId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => {
      const newMats = prev.materiales.includes(materialId)
        ? prev.materiales.filter(m => m !== materialId)
        : [...prev.materiales, materialId];
      return { ...prev, materiales: newMats };
    });
  }, [isClaseCompletada]);

  // Toggle adaptación selection
  const toggleAdaptacion = useCallback((adaptacionId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => {
      const newAdapts = prev.adaptaciones.includes(adaptacionId)
        ? prev.adaptaciones.filter(a => a !== adaptacionId)
        : [...prev.adaptaciones, adaptacionId];
      return { ...prev, adaptaciones: newAdapts };
    });
  }, [isClaseCompletada]);

  // Change area and reset dependent fields
  const changeArea = useCallback((areaId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => ({
      ...prev,
      areaAcademica: areaId,
      competencias: [],
      capacidadesPorCompetencia: {},
      desempenosPorCompetencia: {}
    }));
  }, [isClaseCompletada]);

  return {
    formData,
    setFormData,
    setFormValues,
    resetForm,
    updateField,
    toggleCompetencia,
    toggleCapacidadForCompetencia,
    updateDesempenoForCompetencia,
    addDesempenoForCompetencia,
    removeDesempenoFromCompetencia,
    getCapacidadesForCompetencia,
    handleGenerarDesempenoParaCompetencia,
    generatingForCompetencia,
    toggleMaterial,
    toggleAdaptacion,
    changeArea
  };
}
