import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AreaCurricular {
  id: string;
  nombre: string;
  id_institucion: string | null;
  nivel: string | null;
  created_at: string;
}

export function useAreasCurriculares(nivel?: string) {
  const { data: areas = [], isLoading, error } = useQuery({
    queryKey: ['areas-curriculares', nivel],
    queryFn: async () => {
      let query = supabase
        .from('areas_curriculares')
        .select('*')
        .order('nombre');

      // Filter by nivel: include areas with matching nivel OR null (applies to all)
      if (nivel) {
        query = query.or(`nivel.is.null,nivel.eq.${nivel}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AreaCurricular[];
    }
  });

  return { areas, isLoading, error };
}
