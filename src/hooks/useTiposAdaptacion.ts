import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TipoAdaptacion {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export function useTiposAdaptacion() {
  const { data: tiposAdaptacion = [], isLoading, error } = useQuery({
    queryKey: ['tipos-adaptacion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_adaptacion')
        .select('*')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data as TipoAdaptacion[];
    }
  });

  return { tiposAdaptacion, isLoading, error };
}
