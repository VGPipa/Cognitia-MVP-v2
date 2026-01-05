import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CompetenciaCNEB {
  id: string;
  id_area: string;
  nombre: string;
  codigo: string | null;
  orden: number;
  created_at: string;
}

export function useCompetenciasCNEB(areaId?: string) {
  const { data: competencias = [], isLoading, error } = useQuery({
    queryKey: ['competencias-cneb', areaId],
    queryFn: async () => {
      let query = supabase
        .from('competencias_cneb')
        .select('*')
        .order('orden');

      if (areaId) {
        query = query.eq('id_area', areaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CompetenciaCNEB[];
    },
    enabled: !!areaId
  });

  return { competencias, isLoading, error };
}
