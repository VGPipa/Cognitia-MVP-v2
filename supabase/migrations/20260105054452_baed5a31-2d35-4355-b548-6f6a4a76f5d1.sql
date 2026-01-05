
-- =====================================================
-- DATOS COMPLETOS PARA HEIDI VARGAS - DOCENTE DE COMUNICACIÓN
-- =====================================================

-- Profesor Heidi: 5d0a0718-7605-4b0c-af46-79384c7dae83
-- User ID Heidi: 4a6ed783-72b7-4e52-a9a1-08fbb2aab96b
-- Institución Demo: 00000000-0000-0000-0000-000000000001

-- 1. CREAR AÑO ESCOLAR 2025
INSERT INTO public.anios_escolares (id, anio_escolar, fecha_inicio, fecha_fin, activo, id_institucion)
VALUES (
  'ae000001-0000-0000-0000-000000000001',
  '2025',
  '2025-03-01',
  '2025-12-15',
  true,
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- 2. CREAR GRUPOS DE SECUNDARIA
INSERT INTO public.grupos (id, nombre, grado, seccion, cantidad_alumnos, id_institucion)
VALUES 
  ('11111111-1111-1111-1111-111111111101', '2° Secundaria A', '2° Secundaria', 'A', 30, '00000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111102', '3° Secundaria A', '3° Secundaria', 'A', 28, '00000000-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111103', '4° Secundaria A', '4° Secundaria', 'A', 25, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- 3. CREAR PLANES ANUALES POR GRADO
INSERT INTO public.planes_anuales (id, grado, anio, descripcion, estado, id_institucion, created_by, plan_base)
VALUES 
  ('22222222-2222-2222-2222-222222222201', '2° Secundaria', '2025', 'Plan Anual 2° Secundaria 2025', 'activo', '00000000-0000-0000-0000-000000000001', '4a6ed783-72b7-4e52-a9a1-08fbb2aab96b', false),
  ('22222222-2222-2222-2222-222222222202', '3° Secundaria', '2025', 'Plan Anual 3° Secundaria 2025', 'activo', '00000000-0000-0000-0000-000000000001', '4a6ed783-72b7-4e52-a9a1-08fbb2aab96b', false),
  ('22222222-2222-2222-2222-222222222203', '4° Secundaria', '2025', 'Plan Anual 4° Secundaria 2025', 'activo', '00000000-0000-0000-0000-000000000001', '4a6ed783-72b7-4e52-a9a1-08fbb2aab96b', false)
ON CONFLICT (id) DO NOTHING;

-- 4. CREAR CURSOS DE COMUNICACIÓN EN CADA PLAN
INSERT INTO public.cursos_plan (id, plan_id, nombre, descripcion, horas_semanales, orden, objetivos)
VALUES 
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', 'Comunicación', 'Área de Comunicación para 2° Secundaria', 5, 1, 'Desarrollar competencias comunicativas orales y escritas'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', 'Comunicación', 'Área de Comunicación para 3° Secundaria', 5, 1, 'Fortalecer la comprensión lectora y producción de textos'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222203', 'Comunicación', 'Área de Comunicación para 4° Secundaria', 5, 1, 'Dominar la argumentación y análisis literario')
ON CONFLICT (id) DO NOTHING;

-- 5. CREAR TEMAS PARA CADA CURSO

-- Temas 2° Secundaria - Comunicación
INSERT INTO public.temas_plan (id, curso_plan_id, nombre, descripcion, objetivos, bimestre, orden, duracion_estimada, competencias, estandares)
VALUES 
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'El texto narrativo', 'Comprensión y análisis de textos narrativos', 'Identificar elementos y estructura del texto narrativo', 1, 1, 4, ARRAY['Comprensión lectora', 'Análisis textual'], ARRAY['Lee diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'Elementos de la narración', 'Personajes, tiempo, espacio y narrador', 'Reconocer y analizar los elementos narrativos', 1, 2, 4, ARRAY['Comprensión lectora', 'Pensamiento crítico'], ARRAY['Infiere e interpreta información del texto']),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'El texto descriptivo', 'Características y tipos de descripción', 'Producir textos descriptivos coherentes', 2, 1, 4, ARRAY['Producción escrita', 'Creatividad'], ARRAY['Escribe diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'Técnicas de descripción', 'Recursos literarios para describir', 'Aplicar técnicas descriptivas en la escritura', 2, 2, 4, ARRAY['Producción escrita', 'Expresión literaria'], ARRAY['Utiliza convenciones del lenguaje escrito']),

-- Temas 3° Secundaria - Comunicación
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333302', 'El texto argumentativo', 'Estructura y características del texto argumentativo', 'Comprender la estructura argumentativa', 1, 1, 5, ARRAY['Comprensión lectora', 'Pensamiento crítico'], ARRAY['Lee diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444406', '33333333-3333-3333-3333-333333333302', 'Estructura del argumento', 'Tesis, argumentos y conclusión', 'Identificar y construir argumentos sólidos', 1, 2, 5, ARRAY['Producción escrita', 'Razonamiento lógico'], ARRAY['Escribe diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444407', '33333333-3333-3333-3333-333333333302', 'El ensayo literario', 'Características y estructura del ensayo', 'Producir ensayos literarios', 2, 1, 5, ARRAY['Producción escrita', 'Análisis literario'], ARRAY['Escribe diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444408', '33333333-3333-3333-3333-333333333302', 'Análisis crítico', 'Herramientas para el análisis de textos', 'Desarrollar el pensamiento crítico literario', 2, 2, 5, ARRAY['Pensamiento crítico', 'Comprensión lectora'], ARRAY['Reflexiona y evalúa textos']),

-- Temas 4° Secundaria - Comunicación
  ('44444444-4444-4444-4444-444444444409', '33333333-3333-3333-3333-333333333303', 'Literatura peruana contemporánea', 'Autores y obras representativas', 'Conocer la literatura peruana actual', 1, 1, 6, ARRAY['Análisis literario', 'Identidad cultural'], ARRAY['Lee diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444410', '33333333-3333-3333-3333-333333333303', 'Corrientes literarias', 'Movimientos literarios del siglo XX y XXI', 'Identificar corrientes y sus características', 1, 2, 6, ARRAY['Análisis literario', 'Pensamiento crítico'], ARRAY['Infiere e interpreta información del texto']),
  ('44444444-4444-4444-4444-444444444411', '33333333-3333-3333-3333-333333333303', 'Producción de textos académicos', 'El informe y la monografía', 'Producir textos académicos formales', 2, 1, 6, ARRAY['Producción escrita', 'Investigación'], ARRAY['Escribe diversos tipos de textos']),
  ('44444444-4444-4444-4444-444444444412', '33333333-3333-3333-3333-333333333303', 'El artículo de opinión', 'Estructura y redacción de artículos', 'Redactar artículos de opinión fundamentados', 2, 2, 6, ARRAY['Producción escrita', 'Argumentación'], ARRAY['Escribe diversos tipos de textos'])
ON CONFLICT (id) DO NOTHING;

-- 6. ACTUALIZAR ESPECIALIDAD DE HEIDI VARGAS
UPDATE public.profesores 
SET especialidad = 'Comunicación'
WHERE id = '5d0a0718-7605-4b0c-af46-79384c7dae83';

-- 7. CREAR ASIGNACIONES (vincular a Heidi con cada grupo y curso)
INSERT INTO public.asignaciones_profesor (id, id_profesor, id_grupo, id_materia, anio_escolar)
VALUES 
  ('55555555-5555-5555-5555-555555555501', '5d0a0718-7605-4b0c-af46-79384c7dae83', '11111111-1111-1111-1111-111111111101', '33333333-3333-3333-3333-333333333301', '2025'),
  ('55555555-5555-5555-5555-555555555502', '5d0a0718-7605-4b0c-af46-79384c7dae83', '11111111-1111-1111-1111-111111111102', '33333333-3333-3333-3333-333333333302', '2025'),
  ('55555555-5555-5555-5555-555555555503', '5d0a0718-7605-4b0c-af46-79384c7dae83', '11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333303', '2025')
ON CONFLICT (id) DO NOTHING;
