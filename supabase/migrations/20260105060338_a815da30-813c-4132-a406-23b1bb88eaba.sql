-- =============================================
-- PARTE 1: Crear tablas del currículo CNEB
-- =============================================

-- Tabla de áreas curriculares
CREATE TABLE public.areas_curriculares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  id_institucion UUID REFERENCES public.instituciones(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de competencias CNEB
CREATE TABLE public.competencias_cneb (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_area UUID NOT NULL REFERENCES public.areas_curriculares(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  codigo TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de capacidades CNEB
CREATE TABLE public.capacidades_cneb (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_competencia UUID NOT NULL REFERENCES public.competencias_cneb(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de enfoques transversales
CREATE TABLE public.enfoques_transversales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  id_institucion UUID REFERENCES public.instituciones(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla de tipos de adaptación (NEE)
CREATE TABLE public.tipos_adaptacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- PARTE 2: Modificar tabla clases
-- =============================================

ALTER TABLE public.clases 
  ADD COLUMN nivel TEXT,
  ADD COLUMN id_area_curricular UUID REFERENCES public.areas_curriculares(id),
  ADD COLUMN competencias_ids UUID[] DEFAULT '{}',
  ADD COLUMN capacidades_ids UUID[] DEFAULT '{}',
  ADD COLUMN desempeno TEXT,
  ADD COLUMN id_enfoque_transversal UUID REFERENCES public.enfoques_transversales(id),
  ADD COLUMN materiales JSONB DEFAULT '[]',
  ADD COLUMN adaptaciones_ids UUID[] DEFAULT '{}',
  ADD COLUMN adaptaciones_personalizadas TEXT;

-- =============================================
-- PARTE 3: Habilitar RLS
-- =============================================

ALTER TABLE public.areas_curriculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencias_cneb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacidades_cneb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enfoques_transversales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_adaptacion ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 4: Políticas RLS - Lectura pública
-- =============================================

-- Areas curriculares
CREATE POLICY "Everyone can view areas_curriculares" ON public.areas_curriculares
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage areas_curriculares" ON public.areas_curriculares
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Competencias CNEB
CREATE POLICY "Everyone can view competencias_cneb" ON public.competencias_cneb
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage competencias_cneb" ON public.competencias_cneb
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Capacidades CNEB
CREATE POLICY "Everyone can view capacidades_cneb" ON public.capacidades_cneb
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage capacidades_cneb" ON public.capacidades_cneb
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enfoques transversales
CREATE POLICY "Everyone can view enfoques_transversales" ON public.enfoques_transversales
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage enfoques_transversales" ON public.enfoques_transversales
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Tipos de adaptación
CREATE POLICY "Everyone can view tipos_adaptacion" ON public.tipos_adaptacion
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage tipos_adaptacion" ON public.tipos_adaptacion
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- PARTE 5: Datos iniciales - Áreas curriculares
-- =============================================

INSERT INTO public.areas_curriculares (nombre) VALUES
  ('Comunicación'),
  ('Matemática'),
  ('Ciencias Sociales'),
  ('Ciencia y Tecnología'),
  ('Arte y Cultura'),
  ('Educación Física'),
  ('Educación Religiosa'),
  ('Inglés');

-- =============================================
-- PARTE 6: Datos iniciales - Competencias de Comunicación
-- =============================================

-- Obtener el ID del área Comunicación para insertar competencias
WITH area_comunicacion AS (
  SELECT id FROM public.areas_curriculares WHERE nombre = 'Comunicación' LIMIT 1
)
INSERT INTO public.competencias_cneb (id_area, nombre, orden)
SELECT 
  area_comunicacion.id,
  competencia.nombre,
  competencia.orden
FROM area_comunicacion, (VALUES
  ('Se comunica oralmente en su lengua materna', 1),
  ('Lee diversos tipos de textos escritos en su lengua materna', 2),
  ('Escribe diversos tipos de textos en su lengua materna', 3)
) AS competencia(nombre, orden);

-- =============================================
-- PARTE 7: Datos iniciales - Capacidades por competencia
-- =============================================

-- Capacidades para "Se comunica oralmente..."
WITH comp AS (
  SELECT id FROM public.competencias_cneb 
  WHERE nombre = 'Se comunica oralmente en su lengua materna' LIMIT 1
)
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT comp.id, cap.nombre, cap.orden
FROM comp, (VALUES
  ('Obtiene información del texto oral', 1),
  ('Infiere e interpreta información del texto oral', 2),
  ('Adecúa, organiza y desarrolla las ideas de forma coherente y cohesionada', 3),
  ('Utiliza recursos no verbales y paraverbales de forma estratégica', 4),
  ('Interactúa estratégicamente con distintos interlocutores', 5),
  ('Reflexiona y evalúa la forma, el contenido y contexto del texto oral', 6)
) AS cap(nombre, orden);

-- Capacidades para "Lee diversos tipos de textos..."
WITH comp AS (
  SELECT id FROM public.competencias_cneb 
  WHERE nombre = 'Lee diversos tipos de textos escritos en su lengua materna' LIMIT 1
)
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT comp.id, cap.nombre, cap.orden
FROM comp, (VALUES
  ('Obtiene información del texto escrito', 1),
  ('Infiere e interpreta información del texto', 2),
  ('Reflexiona y evalúa la forma, el contenido y contexto del texto', 3)
) AS cap(nombre, orden);

-- Capacidades para "Escribe diversos tipos de textos..."
WITH comp AS (
  SELECT id FROM public.competencias_cneb 
  WHERE nombre = 'Escribe diversos tipos de textos en su lengua materna' LIMIT 1
)
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT comp.id, cap.nombre, cap.orden
FROM comp, (VALUES
  ('Adecúa el texto a la situación comunicativa', 1),
  ('Organiza y desarrolla las ideas de forma coherente y cohesionada', 2),
  ('Utiliza convenciones del lenguaje escrito de forma pertinente', 3),
  ('Reflexiona y evalúa la forma, el contenido y contexto del texto escrito', 4)
) AS cap(nombre, orden);

-- =============================================
-- PARTE 8: Datos iniciales - Enfoques transversales
-- =============================================

INSERT INTO public.enfoques_transversales (nombre, descripcion) VALUES
  ('Enfoque de Derechos', 'Reconoce a los estudiantes como sujetos de derechos y no como objetos de cuidado'),
  ('Enfoque Inclusivo o de Atención a la Diversidad', 'Atiende las necesidades educativas especiales de los estudiantes'),
  ('Enfoque Intercultural', 'Reconoce la diversidad cultural como riqueza'),
  ('Enfoque de Igualdad de Género', 'Promueve la igualdad de oportunidades entre hombres y mujeres'),
  ('Enfoque Ambiental', 'Forma ciudadanos conscientes y comprometidos con el medio ambiente'),
  ('Enfoque Orientación al Bien Común', 'Promueve valores como la solidaridad, empatía y justicia'),
  ('Enfoque Búsqueda de la Excelencia', 'Fomenta el esfuerzo por mejorar continuamente');

-- =============================================
-- PARTE 9: Datos iniciales - Tipos de adaptación (NEE)
-- =============================================

INSERT INTO public.tipos_adaptacion (nombre, descripcion) VALUES
  ('TDA', 'Trastorno por Déficit de Atención'),
  ('TDAH', 'Trastorno por Déficit de Atención e Hiperactividad'),
  ('TEA', 'Trastorno del Espectro Autista'),
  ('Síndrome de Down', 'Condición genética que causa discapacidad intelectual'),
  ('Dislexia', 'Dificultad específica del aprendizaje de la lectura'),
  ('Discalculia', 'Dificultad específica del aprendizaje de las matemáticas'),
  ('Altas capacidades', 'Superdotación o talento excepcional'),
  ('Discapacidad visual', 'Baja visión o ceguera'),
  ('Discapacidad auditiva', 'Hipoacusia o sordera'),
  ('Discapacidad motora', 'Limitaciones en el movimiento'),
  ('Dificultades de lenguaje', 'Trastornos del habla o lenguaje'),
  ('Trastorno del aprendizaje no verbal', 'Dificultades en habilidades no verbales');