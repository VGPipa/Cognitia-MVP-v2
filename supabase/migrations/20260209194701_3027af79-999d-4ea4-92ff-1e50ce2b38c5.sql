
-- planes_anuales: replace permissive true policies with admin check
DROP POLICY IF EXISTS "Admin users can insert plans" ON public.planes_anuales;
DROP POLICY IF EXISTS "Admin users can update plans" ON public.planes_anuales;
DROP POLICY IF EXISTS "Admin users can delete plans" ON public.planes_anuales;
DROP POLICY IF EXISTS "Admin users can view all plans" ON public.planes_anuales;

CREATE POLICY "Admin can manage planes_anuales" ON public.planes_anuales FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profesores can view planes_anuales" ON public.planes_anuales FOR SELECT USING (has_role(auth.uid(), 'profesor'::app_role));

-- cursos_plan: replace permissive true policies with admin check
DROP POLICY IF EXISTS "Admin users can insert cursos" ON public.cursos_plan;
DROP POLICY IF EXISTS "Admin users can update cursos" ON public.cursos_plan;
DROP POLICY IF EXISTS "Admin users can delete cursos" ON public.cursos_plan;
DROP POLICY IF EXISTS "Admin users can view all cursos" ON public.cursos_plan;

CREATE POLICY "Admin can manage cursos_plan" ON public.cursos_plan FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profesores can view cursos_plan" ON public.cursos_plan FOR SELECT USING (has_role(auth.uid(), 'profesor'::app_role));

-- temas_plan: replace permissive true policies with admin check
DROP POLICY IF EXISTS "Admin users can insert temas" ON public.temas_plan;
DROP POLICY IF EXISTS "Admin users can update temas" ON public.temas_plan;
DROP POLICY IF EXISTS "Admin users can delete temas" ON public.temas_plan;
DROP POLICY IF EXISTS "Admin users can view all temas" ON public.temas_plan;

CREATE POLICY "Admin can manage temas_plan" ON public.temas_plan FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Profesores can view temas_plan" ON public.temas_plan FOR SELECT USING (has_role(auth.uid(), 'profesor'::app_role));
