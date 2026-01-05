import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CapacidadCNEB {
  id: string;
  id_competencia: string;
  nombre: string;
  orden: number;
  created_at: string;
}

export function useCapacidadesCNEB(competenciaIds?: string[]) {
  const { data: capacidades = [], isLoading, error } = useQuery({
    queryKey: ['capacidades-cneb', competenciaIds],
    queryFn: async () => {
      if (!competenciaIds || competenciaIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('capacidades_cneb')
        .select('*')
        .in('id_competencia', competenciaIds)
        .order('orden');

      if (error) throw error;
      return data as CapacidadCNEB[];
    },
    enabled: !!competenciaIds && competenciaIds.length > 0
  });

  return { capacidades, isLoading, error };
}
