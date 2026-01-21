-- Agregar columna nivel a competencias_cneb
ALTER TABLE competencias_cneb 
ADD COLUMN IF NOT EXISTS nivel text;

-- Agregar columna nivel a areas_curriculares
ALTER TABLE areas_curriculares 
ADD COLUMN IF NOT EXISTS nivel text;

-- Crear índices para mejorar rendimiento de filtros por nivel
CREATE INDEX IF NOT EXISTS idx_competencias_cneb_nivel ON competencias_cneb(nivel);
CREATE INDEX IF NOT EXISTS idx_areas_curriculares_nivel ON areas_curriculares(nivel);

-- Migrar datos existentes: asignar niveles a áreas curriculares específicas
-- Ciencias Sociales -> Solo Secundaria
UPDATE areas_curriculares SET nivel = 'Secundaria' WHERE nombre ILIKE '%Ciencias Sociales%';

-- DPCC (Desarrollo Personal, Ciudadanía y Cívica) -> Solo Secundaria
UPDATE areas_curriculares SET nivel = 'Secundaria' WHERE nombre ILIKE '%DPCC%' OR nombre ILIKE '%Desarrollo Personal, Ciudadanía%';

-- Personal Social -> Primaria (en Inicial se llama igual pero con competencias diferentes)
-- Por ahora dejamos NULL las áreas que aplican a múltiples niveles

-- Actualizar competencias relacionadas con áreas de nivel específico
UPDATE competencias_cneb 
SET nivel = ac.nivel
FROM areas_curriculares ac
WHERE competencias_cneb.id_area = ac.id AND ac.nivel IS NOT NULL;