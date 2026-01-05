import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EnfoqueTransversal {
  id: string;
  nombre: string;
  descripcion: string | null;
  id_institucion: string | null;
  created_at: string;
}

export function useEnfoquesTransversales() {
  const { data: enfoques = [], isLoading, error } = useQuery({
    queryKey: ['enfoques-transversales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enfoques_transversales')
        .select('*')
        .order('nombre');

      if (error) throw error;
      return data as EnfoqueTransversal[];
    }
  });

  return { enfoques, isLoading, error };
}
