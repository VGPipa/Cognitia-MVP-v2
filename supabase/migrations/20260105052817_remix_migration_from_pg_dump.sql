CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'profesor',
    'alumno',
    'apoderado'
);


--
-- Name: estado_clase; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_clase AS ENUM (
    'borrador',
    'generando_clase',
    'editando_guia',
    'guia_aprobada',
    'clase_programada',
    'en_clase',
    'completada',
    'analizando_resultados'
);


--
-- Name: estado_quiz; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_quiz AS ENUM (
    'borrador',
    'publicado',
    'cerrado'
);


--
-- Name: estado_respuesta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_respuesta AS ENUM (
    'en_progreso',
    'completado'
);


--
-- Name: plan_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.plan_estado AS ENUM (
    'activo',
    'borrador',
    'pendiente'
);


--
-- Name: relacion_apoderado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.relacion_apoderado AS ENUM (
    'padre',
    'madre',
    'tutor'
);


--
-- Name: tipo_pregunta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_pregunta AS ENUM (
    'opcion_multiple',
    'verdadero_falso',
    'respuesta_corta'
);


--
-- Name: tipo_quiz; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_quiz AS ENUM (
    'previo',
    'post'
);


--
-- Name: get_user_institucion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_institucion(_user_id uuid) RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT id_institucion FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  _role text;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  
  -- Crear profile
  INSERT INTO public.profiles (user_id, email, nombre, apellido, id_institucion)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'apellido',
    '00000000-0000-0000-0000-000000000001' -- Institución demo por defecto
  );
  
  -- Asignar rol según selección del usuario
  IF _role IN ('admin', 'profesor', 'alumno', 'apoderado') THEN
    INSERT INTO public.user_roles (user_id, role, id_institucion)
    VALUES (NEW.id, _role::app_role, '00000000-0000-0000-0000-000000000001');
    
    -- Crear registro en tabla específica del rol
    IF _role = 'profesor' THEN
      INSERT INTO public.profesores (user_id) VALUES (NEW.id);
    ELSIF _role = 'alumno' THEN
      INSERT INTO public.alumnos (user_id) VALUES (NEW.id);
    ELSIF _role = 'apoderado' THEN
      INSERT INTO public.apoderados (user_id) VALUES (NEW.id);
    END IF;
  ELSE
    -- Si no hay rol especificado, asignar admin por defecto (compatibilidad)
    INSERT INTO public.user_roles (user_id, role, id_institucion)
    VALUES (NEW.id, 'admin', '00000000-0000-0000-0000-000000000001');
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: alumnos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumnos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    grado text,
    seccion text,
    edad integer,
    caracteristicas jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nombre text,
    apellido text
);


--
-- Name: alumnos_grupo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumnos_grupo (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_alumno uuid NOT NULL,
    id_grupo uuid NOT NULL,
    anio_escolar text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: anios_escolares; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.anios_escolares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_institucion uuid NOT NULL,
    anio_escolar text NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    activo boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: apoderados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.apoderados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    id_alumno uuid,
    relacion public.relacion_apoderado DEFAULT 'tutor'::public.relacion_apoderado,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: asignaciones_profesor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asignaciones_profesor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_profesor uuid NOT NULL,
    id_materia uuid NOT NULL,
    id_grupo uuid NOT NULL,
    anio_escolar text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_tema uuid NOT NULL,
    id_grupo uuid NOT NULL,
    id_profesor uuid NOT NULL,
    id_guia_tema uuid,
    id_guia_version_actual uuid,
    numero_sesion integer DEFAULT 1,
    estado public.estado_clase DEFAULT 'borrador'::public.estado_clase,
    fecha_programada date,
    fecha_ejecutada date,
    duracion_minutos integer DEFAULT 45,
    contexto text,
    metodologia text,
    observaciones text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: configuracion_alertas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_alertas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_institucion uuid NOT NULL,
    dias_urgente integer DEFAULT 2,
    dias_proxima integer DEFAULT 5,
    dias_programada integer DEFAULT 10,
    dias_lejana integer DEFAULT 20,
    rango_dias_clases_pendientes integer DEFAULT 7
);


--
-- Name: cursos_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cursos_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    nombre text NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    objetivos text,
    horas_semanales integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    descripcion text
);


--
-- Name: grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_institucion uuid NOT NULL,
    nombre text NOT NULL,
    grado text NOT NULL,
    seccion text,
    cantidad_alumnos integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guias_clase_versiones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guias_clase_versiones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_clase uuid NOT NULL,
    version_numero integer DEFAULT 1,
    contenido jsonb DEFAULT '{}'::jsonb,
    objetivos text,
    estructura jsonb DEFAULT '{}'::jsonb,
    preguntas_socraticas jsonb DEFAULT '[]'::jsonb,
    estado text DEFAULT 'borrador'::text,
    es_version_final boolean DEFAULT false,
    generada_ia boolean DEFAULT false,
    aprobada_por uuid,
    fecha_aprobacion timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: guias_tema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.guias_tema (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_tema uuid NOT NULL,
    id_profesor uuid NOT NULL,
    contenido jsonb DEFAULT '{}'::jsonb,
    estructura_sesiones jsonb DEFAULT '[]'::jsonb,
    total_sesiones integer DEFAULT 1,
    metodologias text[],
    objetivos_generales text,
    contexto_grupo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: instituciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instituciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    logo text,
    configuracion jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: nota_alumno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nota_alumno (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_alumno uuid NOT NULL,
    id_quiz uuid NOT NULL,
    estado public.estado_respuesta DEFAULT 'en_progreso'::public.estado_respuesta,
    fecha_inicio timestamp with time zone DEFAULT now(),
    fecha_envio timestamp with time zone,
    puntaje_total numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: periodos_academicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.periodos_academicos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_anio_escolar uuid NOT NULL,
    nombre text NOT NULL,
    numero integer NOT NULL,
    fecha_inicio date,
    fecha_fin date,
    activo boolean DEFAULT false
);


--
-- Name: planes_anuales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.planes_anuales (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    grado text NOT NULL,
    anio text NOT NULL,
    estado public.plan_estado DEFAULT 'pendiente'::public.plan_estado NOT NULL,
    descripcion text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id_institucion uuid,
    plan_base boolean DEFAULT false
);


--
-- Name: preguntas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preguntas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_quiz uuid NOT NULL,
    texto_pregunta text NOT NULL,
    tipo public.tipo_pregunta DEFAULT 'opcion_multiple'::public.tipo_pregunta,
    opciones jsonb DEFAULT '[]'::jsonb,
    respuesta_correcta text,
    justificacion text,
    orden integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    concepto text,
    feedback_acierto text
);


--
-- Name: profesores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profesores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    especialidad text,
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    email text,
    nombre text,
    apellido text,
    avatar_url text,
    id_institucion uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quizzes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_clase uuid NOT NULL,
    tipo public.tipo_quiz NOT NULL,
    titulo text NOT NULL,
    instrucciones text,
    estado public.estado_quiz DEFAULT 'borrador'::public.estado_quiz,
    fecha_disponible timestamp with time zone,
    fecha_limite timestamp with time zone,
    tiempo_limite integer DEFAULT 30,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    estimulo_aprendizaje jsonb
);


--
-- Name: recomendaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recomendaciones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contenido text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    id_quiz uuid NOT NULL,
    titulo text,
    tipo text,
    prioridad text,
    momento text,
    concepto_relacionado text,
    analisis_general jsonb
);


--
-- Name: respuestas_detalle; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.respuestas_detalle (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_nota_alumno uuid NOT NULL,
    id_pregunta uuid NOT NULL,
    respuesta_alumno text,
    es_correcta boolean,
    tiempo_segundos integer
);


--
-- Name: temas_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temas_plan (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    curso_plan_id uuid NOT NULL,
    nombre text NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    duracion_estimada integer,
    estandares text[],
    competencias text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    descripcion text,
    objetivos text,
    bimestre integer DEFAULT 1,
    tema_base_id uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    id_institucion uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: alumnos_grupo alumnos_grupo_id_alumno_id_grupo_anio_escolar_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos_grupo
    ADD CONSTRAINT alumnos_grupo_id_alumno_id_grupo_anio_escolar_key UNIQUE (id_alumno, id_grupo, anio_escolar);


--
-- Name: alumnos_grupo alumnos_grupo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos_grupo
    ADD CONSTRAINT alumnos_grupo_pkey PRIMARY KEY (id);


--
-- Name: alumnos alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id);


--
-- Name: alumnos alumnos_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_user_id_key UNIQUE (user_id);


--
-- Name: anios_escolares anios_escolares_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anios_escolares
    ADD CONSTRAINT anios_escolares_pkey PRIMARY KEY (id);


--
-- Name: apoderados apoderados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apoderados
    ADD CONSTRAINT apoderados_pkey PRIMARY KEY (id);


--
-- Name: apoderados apoderados_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apoderados
    ADD CONSTRAINT apoderados_user_id_key UNIQUE (user_id);


--
-- Name: asignaciones_profesor asignaciones_profesor_id_profesor_id_materia_id_grupo_anio__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_profesor
    ADD CONSTRAINT asignaciones_profesor_id_profesor_id_materia_id_grupo_anio__key UNIQUE (id_profesor, id_materia, id_grupo, anio_escolar);


--
-- Name: asignaciones_profesor asignaciones_profesor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_profesor
    ADD CONSTRAINT asignaciones_profesor_pkey PRIMARY KEY (id);


--
-- Name: clases clases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases
    ADD CONSTRAINT clases_pkey PRIMARY KEY (id);


--
-- Name: configuracion_alertas configuracion_alertas_id_institucion_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_alertas
    ADD CONSTRAINT configuracion_alertas_id_institucion_key UNIQUE (id_institucion);


--
-- Name: configuracion_alertas configuracion_alertas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_alertas
    ADD CONSTRAINT configuracion_alertas_pkey PRIMARY KEY (id);


--
-- Name: cursos_plan cursos_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos_plan
    ADD CONSTRAINT cursos_plan_pkey PRIMARY KEY (id);


--
-- Name: grupos grupos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_pkey PRIMARY KEY (id);


--
-- Name: guias_clase_versiones guias_clase_versiones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guias_clase_versiones
    ADD CONSTRAINT guias_clase_versiones_pkey PRIMARY KEY (id);


--
-- Name: guias_tema guias_tema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guias_tema
    ADD CONSTRAINT guias_tema_pkey PRIMARY KEY (id);


--
-- Name: instituciones instituciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_pkey PRIMARY KEY (id);


--
-- Name: periodos_academicos periodos_academicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_academicos
    ADD CONSTRAINT periodos_academicos_pkey PRIMARY KEY (id);


--
-- Name: planes_anuales planes_anuales_grado_anio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planes_anuales
    ADD CONSTRAINT planes_anuales_grado_anio_key UNIQUE (grado, anio);


--
-- Name: planes_anuales planes_anuales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planes_anuales
    ADD CONSTRAINT planes_anuales_pkey PRIMARY KEY (id);


--
-- Name: preguntas preguntas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_pkey PRIMARY KEY (id);


--
-- Name: profesores profesores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_pkey PRIMARY KEY (id);


--
-- Name: profesores profesores_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_user_id_key UNIQUE (user_id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (id);


--
-- Name: recomendaciones recomendaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recomendaciones
    ADD CONSTRAINT recomendaciones_pkey PRIMARY KEY (id);


--
-- Name: nota_alumno respuestas_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nota_alumno
    ADD CONSTRAINT respuestas_alumno_pkey PRIMARY KEY (id);


--
-- Name: respuestas_detalle respuestas_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_detalle
    ADD CONSTRAINT respuestas_detalle_pkey PRIMARY KEY (id);


--
-- Name: temas_plan temas_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temas_plan
    ADD CONSTRAINT temas_plan_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_id_institucion_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_id_institucion_key UNIQUE (user_id, role, id_institucion);


--
-- Name: idx_anios_escolares_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_anios_escolares_institucion ON public.anios_escolares USING btree (id_institucion);


--
-- Name: idx_asignaciones_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asignaciones_grupo ON public.asignaciones_profesor USING btree (id_grupo);


--
-- Name: idx_asignaciones_materia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asignaciones_materia ON public.asignaciones_profesor USING btree (id_materia);


--
-- Name: idx_asignaciones_profesor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_asignaciones_profesor ON public.asignaciones_profesor USING btree (id_profesor);


--
-- Name: idx_clases_estado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clases_estado ON public.clases USING btree (estado);


--
-- Name: idx_clases_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clases_grupo ON public.clases USING btree (id_grupo);


--
-- Name: idx_clases_profesor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clases_profesor ON public.clases USING btree (id_profesor);


--
-- Name: idx_clases_tema; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clases_tema ON public.clases USING btree (id_tema);


--
-- Name: idx_cursos_plan_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cursos_plan_plan_id ON public.cursos_plan USING btree (plan_id);


--
-- Name: idx_grupos_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grupos_institucion ON public.grupos USING btree (id_institucion);


--
-- Name: idx_periodos_anio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_periodos_anio ON public.periodos_academicos USING btree (id_anio_escolar);


--
-- Name: idx_preguntas_concepto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preguntas_concepto ON public.preguntas USING btree (concepto);


--
-- Name: idx_preguntas_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preguntas_quiz ON public.preguntas USING btree (id_quiz);


--
-- Name: idx_profiles_institucion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_institucion ON public.profiles USING btree (id_institucion);


--
-- Name: idx_profiles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_user ON public.profiles USING btree (user_id);


--
-- Name: idx_quizzes_clase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quizzes_clase ON public.quizzes USING btree (id_clase);


--
-- Name: idx_respuestas_alumno_alumno; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respuestas_alumno_alumno ON public.nota_alumno USING btree (id_alumno);


--
-- Name: idx_respuestas_alumno_quiz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_respuestas_alumno_quiz ON public.nota_alumno USING btree (id_quiz);


--
-- Name: idx_temas_plan_curso_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_temas_plan_curso_id ON public.temas_plan USING btree (curso_plan_id);


--
-- Name: idx_user_roles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id);


--
-- Name: clases update_clases_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_clases_updated_at BEFORE UPDATE ON public.clases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cursos_plan update_cursos_plan_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cursos_plan_updated_at BEFORE UPDATE ON public.cursos_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: guias_tema update_guias_tema_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_guias_tema_updated_at BEFORE UPDATE ON public.guias_tema FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: instituciones update_instituciones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_instituciones_updated_at BEFORE UPDATE ON public.instituciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: planes_anuales update_planes_anuales_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_planes_anuales_updated_at BEFORE UPDATE ON public.planes_anuales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: temas_plan update_temas_plan_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_temas_plan_updated_at BEFORE UPDATE ON public.temas_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alumnos_grupo alumnos_grupo_id_alumno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos_grupo
    ADD CONSTRAINT alumnos_grupo_id_alumno_fkey FOREIGN KEY (id_alumno) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: alumnos_grupo alumnos_grupo_id_grupo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos_grupo
    ADD CONSTRAINT alumnos_grupo_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupos(id) ON DELETE CASCADE;


--
-- Name: alumnos alumnos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: anios_escolares anios_escolares_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.anios_escolares
    ADD CONSTRAINT anios_escolares_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: apoderados apoderados_id_alumno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apoderados
    ADD CONSTRAINT apoderados_id_alumno_fkey FOREIGN KEY (id_alumno) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: apoderados apoderados_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.apoderados
    ADD CONSTRAINT apoderados_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: asignaciones_profesor asignaciones_profesor_id_grupo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_profesor
    ADD CONSTRAINT asignaciones_profesor_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupos(id) ON DELETE CASCADE;


--
-- Name: asignaciones_profesor asignaciones_profesor_id_materia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_profesor
    ADD CONSTRAINT asignaciones_profesor_id_materia_fkey FOREIGN KEY (id_materia) REFERENCES public.cursos_plan(id) ON DELETE CASCADE;


--
-- Name: asignaciones_profesor asignaciones_profesor_id_profesor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_profesor
    ADD CONSTRAINT asignaciones_profesor_id_profesor_fkey FOREIGN KEY (id_profesor) REFERENCES public.profesores(id) ON DELETE CASCADE;


--
-- Name: clases clases_id_grupo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases
    ADD CONSTRAINT clases_id_grupo_fkey FOREIGN KEY (id_grupo) REFERENCES public.grupos(id) ON DELETE CASCADE;


--
-- Name: clases clases_id_guia_tema_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases
    ADD CONSTRAINT clases_id_guia_tema_fkey FOREIGN KEY (id_guia_tema) REFERENCES public.guias_tema(id) ON DELETE SET NULL;


--
-- Name: clases clases_id_guia_version_actual_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases
    ADD CONSTRAINT clases_id_guia_version_actual_fkey FOREIGN KEY (id_guia_version_actual) REFERENCES public.guias_clase_versiones(id) ON DELETE SET NULL;


--
-- Name: clases clases_id_profesor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases
    ADD CONSTRAINT clases_id_profesor_fkey FOREIGN KEY (id_profesor) REFERENCES public.profesores(id) ON DELETE CASCADE;


--
-- Name: clases clases_id_tema_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clases
    ADD CONSTRAINT clases_id_tema_fkey FOREIGN KEY (id_tema) REFERENCES public.temas_plan(id) ON DELETE CASCADE;


--
-- Name: configuracion_alertas configuracion_alertas_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_alertas
    ADD CONSTRAINT configuracion_alertas_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: cursos_plan cursos_plan_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cursos_plan
    ADD CONSTRAINT cursos_plan_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.planes_anuales(id) ON DELETE CASCADE;


--
-- Name: grupos grupos_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupos
    ADD CONSTRAINT grupos_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: guias_clase_versiones guias_clase_versiones_aprobada_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guias_clase_versiones
    ADD CONSTRAINT guias_clase_versiones_aprobada_por_fkey FOREIGN KEY (aprobada_por) REFERENCES public.profesores(id);


--
-- Name: guias_clase_versiones guias_clase_versiones_id_clase_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guias_clase_versiones
    ADD CONSTRAINT guias_clase_versiones_id_clase_fkey FOREIGN KEY (id_clase) REFERENCES public.clases(id) ON DELETE CASCADE;


--
-- Name: guias_tema guias_tema_id_profesor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guias_tema
    ADD CONSTRAINT guias_tema_id_profesor_fkey FOREIGN KEY (id_profesor) REFERENCES public.profesores(id) ON DELETE CASCADE;


--
-- Name: guias_tema guias_tema_id_tema_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.guias_tema
    ADD CONSTRAINT guias_tema_id_tema_fkey FOREIGN KEY (id_tema) REFERENCES public.temas_plan(id) ON DELETE CASCADE;


--
-- Name: nota_alumno nota_alumno_id_alumno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nota_alumno
    ADD CONSTRAINT nota_alumno_id_alumno_fkey FOREIGN KEY (id_alumno) REFERENCES public.alumnos(id) ON DELETE CASCADE;


--
-- Name: nota_alumno nota_alumno_id_quiz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nota_alumno
    ADD CONSTRAINT nota_alumno_id_quiz_fkey FOREIGN KEY (id_quiz) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: periodos_academicos periodos_academicos_id_anio_escolar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.periodos_academicos
    ADD CONSTRAINT periodos_academicos_id_anio_escolar_fkey FOREIGN KEY (id_anio_escolar) REFERENCES public.anios_escolares(id) ON DELETE CASCADE;


--
-- Name: planes_anuales planes_anuales_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.planes_anuales
    ADD CONSTRAINT planes_anuales_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: preguntas preguntas_id_quiz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preguntas
    ADD CONSTRAINT preguntas_id_quiz_fkey FOREIGN KEY (id_quiz) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: profesores profesores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profesores
    ADD CONSTRAINT profesores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quizzes quizzes_id_clase_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_id_clase_fkey FOREIGN KEY (id_clase) REFERENCES public.clases(id) ON DELETE CASCADE;


--
-- Name: recomendaciones recomendaciones_id_quiz_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recomendaciones
    ADD CONSTRAINT recomendaciones_id_quiz_fkey FOREIGN KEY (id_quiz) REFERENCES public.quizzes(id) ON DELETE CASCADE;


--
-- Name: respuestas_detalle respuestas_detalle_id_nota_alumno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_detalle
    ADD CONSTRAINT respuestas_detalle_id_nota_alumno_fkey FOREIGN KEY (id_nota_alumno) REFERENCES public.nota_alumno(id) ON DELETE CASCADE;


--
-- Name: respuestas_detalle respuestas_detalle_id_pregunta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.respuestas_detalle
    ADD CONSTRAINT respuestas_detalle_id_pregunta_fkey FOREIGN KEY (id_pregunta) REFERENCES public.preguntas(id) ON DELETE CASCADE;


--
-- Name: temas_plan temas_plan_curso_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temas_plan
    ADD CONSTRAINT temas_plan_curso_plan_id_fkey FOREIGN KEY (curso_plan_id) REFERENCES public.cursos_plan(id) ON DELETE CASCADE;


--
-- Name: temas_plan temas_plan_tema_base_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temas_plan
    ADD CONSTRAINT temas_plan_tema_base_id_fkey FOREIGN KEY (tema_base_id) REFERENCES public.temas_plan(id) ON DELETE SET NULL;


--
-- Name: user_roles user_roles_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: alumnos Admin can manage alumnos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage alumnos" ON public.alumnos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: alumnos_grupo Admin can manage alumnos_grupo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage alumnos_grupo" ON public.alumnos_grupo TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: anios_escolares Admin can manage anios_escolares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage anios_escolares" ON public.anios_escolares TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: apoderados Admin can manage apoderados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage apoderados" ON public.apoderados TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: asignaciones_profesor Admin can manage asignaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage asignaciones" ON public.asignaciones_profesor TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: clases Admin can manage clases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage clases" ON public.clases TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: configuracion_alertas Admin can manage config_alertas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage config_alertas" ON public.configuracion_alertas TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: grupos Admin can manage grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage grupos" ON public.grupos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: guias_tema Admin can manage guias_tema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage guias_tema" ON public.guias_tema TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: guias_clase_versiones Admin can manage guias_versiones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage guias_versiones" ON public.guias_clase_versiones TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: instituciones Admin can manage instituciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage instituciones" ON public.instituciones TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: nota_alumno Admin can manage nota_alumno; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage nota_alumno" ON public.nota_alumno USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: periodos_academicos Admin can manage periodos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage periodos" ON public.periodos_academicos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: preguntas Admin can manage preguntas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage preguntas" ON public.preguntas TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profesores Admin can manage profesores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage profesores" ON public.profesores TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: quizzes Admin can manage quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage quizzes" ON public.quizzes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: recomendaciones Admin can manage recomendaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage recomendaciones" ON public.recomendaciones USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: respuestas_detalle Admin can manage respuestas_detalle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage respuestas_detalle" ON public.respuestas_detalle TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admin can manage user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can manage user_roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admin can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cursos_plan Admin users can delete cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can delete cursos" ON public.cursos_plan FOR DELETE TO authenticated USING (true);


--
-- Name: planes_anuales Admin users can delete plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can delete plans" ON public.planes_anuales FOR DELETE TO authenticated USING (true);


--
-- Name: temas_plan Admin users can delete temas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can delete temas" ON public.temas_plan FOR DELETE TO authenticated USING (true);


--
-- Name: cursos_plan Admin users can insert cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can insert cursos" ON public.cursos_plan FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: planes_anuales Admin users can insert plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can insert plans" ON public.planes_anuales FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: temas_plan Admin users can insert temas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can insert temas" ON public.temas_plan FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cursos_plan Admin users can update cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can update cursos" ON public.cursos_plan FOR UPDATE TO authenticated USING (true);


--
-- Name: planes_anuales Admin users can update plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can update plans" ON public.planes_anuales FOR UPDATE TO authenticated USING (true);


--
-- Name: temas_plan Admin users can update temas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can update temas" ON public.temas_plan FOR UPDATE TO authenticated USING (true);


--
-- Name: cursos_plan Admin users can view all cursos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can view all cursos" ON public.cursos_plan FOR SELECT TO authenticated USING (true);


--
-- Name: planes_anuales Admin users can view all plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can view all plans" ON public.planes_anuales FOR SELECT TO authenticated USING (true);


--
-- Name: temas_plan Admin users can view all temas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin users can view all temas" ON public.temas_plan FOR SELECT TO authenticated USING (true);


--
-- Name: nota_alumno Alumnos can manage own nota_alumno; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Alumnos can manage own nota_alumno" ON public.nota_alumno USING ((id_alumno IN ( SELECT alumnos.id
   FROM public.alumnos
  WHERE (alumnos.user_id = auth.uid()))));


--
-- Name: respuestas_detalle Alumnos can manage own respuestas_detalle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Alumnos can manage own respuestas_detalle" ON public.respuestas_detalle USING ((id_nota_alumno IN ( SELECT nota_alumno.id
   FROM public.nota_alumno
  WHERE (nota_alumno.id_alumno IN ( SELECT alumnos.id
           FROM public.alumnos
          WHERE (alumnos.user_id = auth.uid()))))));


--
-- Name: quizzes Alumnos can view published quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Alumnos can view published quizzes" ON public.quizzes FOR SELECT TO authenticated USING ((estado = 'publicado'::public.estado_quiz));


--
-- Name: alumnos Alumnos can view self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Alumnos can view self" ON public.alumnos FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: apoderados Apoderados can view self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Apoderados can view self" ON public.apoderados FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: clases Profesores can manage own clases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can manage own clases" ON public.clases TO authenticated USING ((id_profesor IN ( SELECT profesores.id
   FROM public.profesores
  WHERE (profesores.user_id = auth.uid()))));


--
-- Name: guias_tema Profesores can manage own guias_tema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can manage own guias_tema" ON public.guias_tema TO authenticated USING ((id_profesor IN ( SELECT profesores.id
   FROM public.profesores
  WHERE (profesores.user_id = auth.uid()))));


--
-- Name: guias_clase_versiones Profesores can manage own guias_versiones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can manage own guias_versiones" ON public.guias_clase_versiones TO authenticated USING ((id_clase IN ( SELECT clases.id
   FROM public.clases
  WHERE (clases.id_profesor IN ( SELECT profesores.id
           FROM public.profesores
          WHERE (profesores.user_id = auth.uid()))))));


--
-- Name: preguntas Profesores can manage preguntas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can manage preguntas" ON public.preguntas TO authenticated USING ((id_quiz IN ( SELECT quizzes.id
   FROM public.quizzes
  WHERE (quizzes.id_clase IN ( SELECT clases.id
           FROM public.clases
          WHERE (clases.id_profesor IN ( SELECT profesores.id
                   FROM public.profesores
                  WHERE (profesores.user_id = auth.uid()))))))));


--
-- Name: quizzes Profesores can manage quizzes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can manage quizzes" ON public.quizzes TO authenticated USING ((id_clase IN ( SELECT clases.id
   FROM public.clases
  WHERE (clases.id_profesor IN ( SELECT profesores.id
           FROM public.profesores
          WHERE (profesores.user_id = auth.uid()))))));


--
-- Name: recomendaciones Profesores can manage recomendaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can manage recomendaciones" ON public.recomendaciones USING ((id_quiz IN ( SELECT q.id
   FROM public.quizzes q
  WHERE (q.id_clase IN ( SELECT c.id
           FROM public.clases c
          WHERE (c.id_profesor IN ( SELECT p.id
                   FROM public.profesores p
                  WHERE (p.user_id = auth.uid()))))))));


--
-- Name: profesores Profesores can view alumnos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can view alumnos" ON public.profesores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'profesor'::public.app_role));


--
-- Name: nota_alumno Profesores can view nota_alumno; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can view nota_alumno" ON public.nota_alumno FOR SELECT USING (public.has_role(auth.uid(), 'profesor'::public.app_role));


--
-- Name: asignaciones_profesor Profesores can view own asignaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can view own asignaciones" ON public.asignaciones_profesor FOR SELECT TO authenticated USING ((id_profesor IN ( SELECT profesores.id
   FROM public.profesores
  WHERE (profesores.user_id = auth.uid()))));


--
-- Name: respuestas_detalle Profesores can view respuestas_detalle; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can view respuestas_detalle" ON public.respuestas_detalle FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'profesor'::public.app_role));


--
-- Name: profesores Profesores can view self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profesores can view self" ON public.profesores FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((user_id = auth.uid()));


--
-- Name: alumnos_grupo Users can view alumnos_grupo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view alumnos_grupo" ON public.alumnos_grupo FOR SELECT TO authenticated USING (true);


--
-- Name: anios_escolares Users can view anios_escolares; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view anios_escolares" ON public.anios_escolares FOR SELECT TO authenticated USING ((id_institucion = public.get_user_institucion(auth.uid())));


--
-- Name: clases Users can view clases; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view clases" ON public.clases FOR SELECT TO authenticated USING (true);


--
-- Name: configuracion_alertas Users can view config_alertas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view config_alertas" ON public.configuracion_alertas FOR SELECT TO authenticated USING ((id_institucion = public.get_user_institucion(auth.uid())));


--
-- Name: grupos Users can view grupos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view grupos" ON public.grupos FOR SELECT TO authenticated USING ((id_institucion = public.get_user_institucion(auth.uid())));


--
-- Name: guias_tema Users can view guias_tema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view guias_tema" ON public.guias_tema FOR SELECT TO authenticated USING (true);


--
-- Name: guias_clase_versiones Users can view guias_versiones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view guias_versiones" ON public.guias_clase_versiones FOR SELECT TO authenticated USING (true);


--
-- Name: instituciones Users can view own institucion; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own institucion" ON public.instituciones FOR SELECT TO authenticated USING ((id = public.get_user_institucion(auth.uid())));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((user_id = auth.uid()));


--
-- Name: periodos_academicos Users can view periodos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view periodos" ON public.periodos_academicos FOR SELECT TO authenticated USING ((id_anio_escolar IN ( SELECT anios_escolares.id
   FROM public.anios_escolares
  WHERE (anios_escolares.id_institucion = public.get_user_institucion(auth.uid())))));


--
-- Name: preguntas Users can view preguntas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view preguntas" ON public.preguntas FOR SELECT TO authenticated USING (true);


--
-- Name: profesores Users can view profesores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view profesores" ON public.profesores FOR SELECT TO authenticated USING (true);


--
-- Name: recomendaciones Users can view recomendaciones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view recomendaciones" ON public.recomendaciones FOR SELECT USING (true);


--
-- Name: alumnos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

--
-- Name: alumnos_grupo; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.alumnos_grupo ENABLE ROW LEVEL SECURITY;

--
-- Name: anios_escolares; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anios_escolares ENABLE ROW LEVEL SECURITY;

--
-- Name: apoderados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.apoderados ENABLE ROW LEVEL SECURITY;

--
-- Name: asignaciones_profesor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.asignaciones_profesor ENABLE ROW LEVEL SECURITY;

--
-- Name: clases; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracion_alertas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;

--
-- Name: cursos_plan; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cursos_plan ENABLE ROW LEVEL SECURITY;

--
-- Name: grupos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;

--
-- Name: guias_clase_versiones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guias_clase_versiones ENABLE ROW LEVEL SECURITY;

--
-- Name: guias_tema; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.guias_tema ENABLE ROW LEVEL SECURITY;

--
-- Name: instituciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;

--
-- Name: nota_alumno; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nota_alumno ENABLE ROW LEVEL SECURITY;

--
-- Name: periodos_academicos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.periodos_academicos ENABLE ROW LEVEL SECURITY;

--
-- Name: planes_anuales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.planes_anuales ENABLE ROW LEVEL SECURITY;

--
-- Name: preguntas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;

--
-- Name: profesores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: quizzes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

--
-- Name: recomendaciones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recomendaciones ENABLE ROW LEVEL SECURITY;

--
-- Name: respuestas_detalle; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.respuestas_detalle ENABLE ROW LEVEL SECURITY;

--
-- Name: temas_plan; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.temas_plan ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;