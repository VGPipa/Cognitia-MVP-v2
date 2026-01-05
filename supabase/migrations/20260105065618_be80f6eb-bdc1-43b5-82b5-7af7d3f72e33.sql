-- Competencia 1: Resuelve problemas de cantidad
INSERT INTO public.competencias_cneb (id_area, nombre, orden) VALUES 
('0e7b6664-41b9-4b32-87b6-6554bcf935b9', 'Resuelve problemas de cantidad', 1);

-- Competencia 2: Resuelve problemas de regularidad, equivalencia y cambio
INSERT INTO public.competencias_cneb (id_area, nombre, orden) VALUES 
('0e7b6664-41b9-4b32-87b6-6554bcf935b9', 'Resuelve problemas de regularidad, equivalencia y cambio', 2);

-- Competencia 3: Resuelve problemas de forma, movimiento y localización
INSERT INTO public.competencias_cneb (id_area, nombre, orden) VALUES 
('0e7b6664-41b9-4b32-87b6-6554bcf935b9', 'Resuelve problemas de forma, movimiento y localización', 3);

-- Competencia 4: Resuelve problemas de gestión de datos e incertidumbre
INSERT INTO public.competencias_cneb (id_area, nombre, orden) VALUES 
('0e7b6664-41b9-4b32-87b6-6554bcf935b9', 'Resuelve problemas de gestión de datos e incertidumbre', 4);

-- Capacidades para "Resuelve problemas de cantidad"
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT c.id, cap.nombre, cap.orden
FROM competencias_cneb c
CROSS JOIN (VALUES 
  ('Traduce cantidades a expresiones numéricas', 1),
  ('Comunica su comprensión sobre los números y las operaciones', 2),
  ('Usa estrategias y procedimientos de estimación y cálculo', 3),
  ('Argumenta afirmaciones sobre las relaciones numéricas y las operaciones', 4)
) AS cap(nombre, orden)
WHERE c.nombre = 'Resuelve problemas de cantidad';

-- Capacidades para "Resuelve problemas de regularidad, equivalencia y cambio"
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT c.id, cap.nombre, cap.orden
FROM competencias_cneb c
CROSS JOIN (VALUES 
  ('Traduce datos y condiciones a expresiones algebraicas y gráficas', 1),
  ('Comunica su comprensión sobre las relaciones algebraicas', 2),
  ('Usa estrategias y procedimientos para encontrar equivalencias y reglas generales', 3),
  ('Argumenta afirmaciones sobre relaciones de cambio y equivalencia', 4)
) AS cap(nombre, orden)
WHERE c.nombre = 'Resuelve problemas de regularidad, equivalencia y cambio';

-- Capacidades para "Resuelve problemas de forma, movimiento y localización"
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT c.id, cap.nombre, cap.ord
FROM competencias_cneb c
CROSS JOIN (VALUES 
  ('Modela objetos con formas geométricas y sus transformaciones', 1),
  ('Comunica su comprensión sobre las formas y relaciones geométricas', 2),
  ('Usa estrategias y procedimientos para medir y orientarse en el espacio', 3),
  ('Argumenta afirmaciones sobre relaciones geométricas', 4)
) AS cap(nombre, ord)
WHERE c.nombre = 'Resuelve problemas de forma, movimiento y localización';

-- Capacidades para "Resuelve problemas de gestión de datos e incertidumbre"
INSERT INTO public.capacidades_cneb (id_competencia, nombre, orden)
SELECT c.id, cap.nombre, cap.orden
FROM competencias_cneb c
CROSS JOIN (VALUES 
  ('Representa datos con gráficos y medidas estadísticas o probabilísticas', 1),
  ('Comunica su comprensión de los conceptos estadísticos y probabilísticos', 2),
  ('Usa estrategias y procedimientos para recopilar y procesar datos', 3),
  ('Sustenta conclusiones o decisiones con base en la información obtenida', 4)
) AS cap(nombre, orden)
WHERE c.nombre = 'Resuelve problemas de gestión de datos e incertidumbre';