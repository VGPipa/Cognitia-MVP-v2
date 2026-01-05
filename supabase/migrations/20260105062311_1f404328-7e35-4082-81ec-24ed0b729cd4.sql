-- Permitir clases sin tema asociado (para clases extraordinarias)
ALTER TABLE public.clases 
ALTER COLUMN id_tema DROP NOT NULL;