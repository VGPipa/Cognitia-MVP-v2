import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompetenciaCNEB {
  id: string;
  id_area: string;
  nombre: string;
  codigo: string | null;
  orden: number;
  nivel: string | null;
  created_at: string;
}

export function useCompetenciasCNEB(areaId?: string, nivel?: string) {
  const { data: competencias = [], isLoading, error } = useQuery({
    queryKey: ['competencias-cneb', areaId, nivel],
    queryFn: async () => {
      let query = supabase
        .from('competencias_cneb')
        .select('*')
        .order('orden');

      if (areaId) {
        query = query.eq('id_area', areaId);
      }

      // Filter by nivel: include competencias with matching nivel OR null (applies to all)
      if (nivel) {
        query = query.or(`nivel.is.null,nivel.eq.${nivel}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CompetenciaCNEB[];
    },
    enabled: !!areaId
  });

  return { competencias, isLoading, error };
}
