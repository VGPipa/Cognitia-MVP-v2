import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AreaCurricular {
  id: string;
  nombre: string;
  id_institucion: string | null;
  created_at: string;
}

export function useAreasCurriculares() {
  const { data: areas = [], isLoading, error } = useQuery({
    queryKey: ['areas-curriculares'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas_curriculares')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data as AreaCurricular[];
    }
  });

  return { areas, isLoading, error };
}
