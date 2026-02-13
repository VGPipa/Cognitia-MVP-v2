import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useProfesor } from '@/hooks/useProfesor';
import { useAsignaciones } from '@/hooks/useAsignaciones';
import { useAniosEscolares } from '@/hooks/useAniosEscolares';
import { useClases, type Clase } from '@/hooks/useClases';
import { useGuiasClase } from '@/hooks/useGuias';
import { useTemasProfesor } from '@/hooks/useTemasProfesor';
import { useAreasCurriculares } from '@/hooks/useAreasCurriculares';
import { useCompetenciasCNEB } from '@/hooks/useCompetenciasCNEB';
import { useCapacidadesCNEB } from '@/hooks/useCapacidadesCNEB';
import { useEnfoquesTransversales } from '@/hooks/useEnfoquesTransversales';
import { useTiposAdaptacion } from '@/hooks/useTiposAdaptacion';

import { supabase } from '@/integrations/supabase/client';
import { generateGuiaClase, type GuiaClaseData } from '@/lib/ai/generate';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Target,
  Loader2,
  Info,
  Lock,
  Heart,
  Eye,
  Settings,
  Calendar,
  Users,
  GraduationCap,
  Wand2,
  Plus,
  X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// Import refactored components
import {
  STEPS,
  MATERIALES_DISPONIBLES,
  HORAS_PEDAGOGICAS,
  STORAGE_KEYS,
  ADAPTACIONES_PRIORITARIAS,
  parseGradoFromGrupo,
  getInitialFormData,
  getMissingFields as getMissingFieldsUtil,
  calculateSectionProgress,
  formatDate,
  formatRelativeTime,
  getEstadoLabel,
  getGradosForNivel,
  SECCIONES_DISPONIBLES,
  type FormData,
  type NivelEducativo
} from '@/components/profesor/GenerarClase';
import { WizardProgress } from '@/components/profesor/GenerarClase/WizardProgress';
import { CompetenciaSection } from '@/components/profesor/GenerarClase/CompetenciaSection';

import { SelectionMode } from '@/components/profesor/GenerarClase/SelectionMode';
import { GuiaClaseViewer } from '@/components/profesor/GenerarClase/GuiaClaseViewer';
import { ValidacionStep } from '@/components/profesor/GenerarClase/ValidacionStep';

export default function GenerarClase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profesorId } = useProfesor();
  const { anioActivo } = useAniosEscolares();
  const anioEscolar = anioActivo?.anio_escolar || String(new Date().getFullYear());
  const { asignaciones, grupos } = useAsignaciones(anioEscolar);
  const { clases, isLoading: clasesLoading, deleteClase } = useClases();
  const { cursosConTemas } = useTemasProfesor(anioEscolar);
  
  const temaId = searchParams.get('tema');
  const cursoId = searchParams.get('curso') || searchParams.get('materia');
  const claseId = searchParams.get('clase');
  
  // View mode state
  const [viewMode, setViewMode] = useState<'selection' | 'wizard'>('selection');
  const [isExtraordinaria, setIsExtraordinaria] = useState(false);
  
  // Selection filters
  const [filtroTema, setFiltroTema] = useState<string>('todos');
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGeneratingDesempeno, setIsGeneratingDesempeno] = useState(false);
  const [userNavigatedBack, setUserNavigatedBack] = useState(false);
  
  // Collapsible "Otro" fields state
  const [showMaterialOtro, setShowMaterialOtro] = useState(false);
  const [showAdaptacionOtro, setShowAdaptacionOtro] = useState(false);
  
  // Data from DB
  const [temaData, setTemaData] = useState<any>(null);
  const [cursoData, setCursoData] = useState<any>(null);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [claseData, setClaseData] = useState<any>(null);
  
  // Check if class is completed (read-only mode)
  const isClaseCompletada = claseData?.estado === 'completada';
  
  // Form state - initialized using utility function
  const [formData, setFormData] = useState<FormData>(getInitialFormData());
  
  
  // State for tracking which competencia is generating desempeños
  const [generatingForCompetencia, setGeneratingForCompetencia] = useState<string | null>(null);

  // CNEB Data hooks - now filtered by nivel
  const { areas } = useAreasCurriculares(formData.nivel || undefined);
  const { competencias: competenciasCNEB } = useCompetenciasCNEB(formData.areaAcademica, formData.nivel || undefined);
  const { capacidades: capacidadesCNEB } = useCapacidadesCNEB(formData.competencias);
  const { enfoques } = useEnfoquesTransversales();
  const { tiposAdaptacion } = useTiposAdaptacion();

  // Filter adaptaciones to show only priority ones
  const adaptacionesFiltradas = useMemo(() => {
    return tiposAdaptacion.filter(t => ADAPTACIONES_PRIORITARIAS.includes(t.nombre));
  }, [tiposAdaptacion]);

  // Generated content
  const [guiaGenerada, setGuiaGenerada] = useState<GuiaClaseData | null>(null);
  const [guiaSaveStatus, setGuiaSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [guiaSaveError, setGuiaSaveError] = useState<string | null>(null);
  const [guiaLastSavedAt, setGuiaLastSavedAt] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  
  // Hooks for DB operations
  const { createClase, updateClase } = useClases();
  const { createGuiaVersion, updateGuiaVersion } = useGuiasClase(claseData?.id);

  // Derived grado info from grupo
  const gradoInfo = useMemo(() => 
    grupoData ? parseGradoFromGrupo(grupoData) : null, 
    [grupoData]
  );

  // Calculate section progress for wizard
  const sectionProgress = useMemo(() => 
    calculateSectionProgress(formData, isExtraordinaria, temaData, grupoData),
    [formData, isExtraordinaria, temaData, grupoData]
  );

  const serializeGuia = useCallback((guia: GuiaClaseData | null) => {
    if (!guia) return null;
    try {
      return JSON.stringify(guia);
    } catch {
      return null;
    }
  }, []);

  const hydrateGuiaState = useCallback((guia: GuiaClaseData | null) => {
    setGuiaGenerada(guia);
    lastSavedSnapshotRef.current = serializeGuia(guia);
    setGuiaSaveStatus('idle');
    setGuiaSaveError(null);
    setGuiaLastSavedAt(null);
  }, [serializeGuia]);

  const saveGuiaVersion = useCallback(async (guia: GuiaClaseData) => {
    if (!claseData?.id_guia_version_actual || isClaseCompletada) return true;

    const snapshot = serializeGuia(guia);
    if (!snapshot || snapshot === lastSavedSnapshotRef.current) return true;

    setGuiaSaveStatus('saving');
    setGuiaSaveError(null);

    try {
      await updateGuiaVersion.mutateAsync({
        id: claseData.id_guia_version_actual,
        contenido: JSON.parse(JSON.stringify(guia)),
        estructura: JSON.parse(JSON.stringify(guia.momentos_sesion)),
        objetivos: guia.propositos_aprendizaje.map((p) => p.competencia).join('\n'),
        silent: true,
      });

      lastSavedSnapshotRef.current = snapshot;
      setGuiaSaveStatus('saved');
      setGuiaLastSavedAt(new Date());
      return true;
    } catch (error: any) {
      setGuiaSaveStatus('error');
      setGuiaSaveError(error?.message || 'No se pudo guardar la guía');
      return false;
    }
  }, [claseData?.id_guia_version_actual, isClaseCompletada, serializeGuia, updateGuiaVersion]);

  const flushPendingGuiaSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (!guiaGenerada || !claseData?.id_guia_version_actual || isClaseCompletada) {
      return true;
    }

    return saveGuiaVersion(guiaGenerada);
  }, [claseData?.id_guia_version_actual, guiaGenerada, isClaseCompletada, saveGuiaVersion]);

  const handleGuiaChange = useCallback((guia: GuiaClaseData) => {
    setGuiaGenerada(guia);
  }, []);

  useEffect(() => {
    if (!guiaGenerada || !claseData?.id_guia_version_actual || isClaseCompletada) return;

    const snapshot = serializeGuia(guiaGenerada);
    if (!snapshot || snapshot === lastSavedSnapshotRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setGuiaSaveStatus('saving');
    setGuiaSaveError(null);

    saveTimeoutRef.current = window.setTimeout(() => {
      saveTimeoutRef.current = null;
      void saveGuiaVersion(guiaGenerada);
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [claseData?.id_guia_version_actual, guiaGenerada, isClaseCompletada, saveGuiaVersion, serializeGuia]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, []);

  // One-time cleanup of old draft localStorage keys
  useEffect(() => {
    try {
      localStorage.removeItem('generar_clase_draft_form');
      localStorage.removeItem('generar_clase_draft_timestamp');
      localStorage.removeItem('generar_clase_draft_dismissed');
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Computed data for selection mode
  const clasesEnProceso = useMemo(() => {
    return clases.filter(c => 
      ['generando_clase', 'editando_guia'].includes(c.estado)
    );
  }, [clases]);

  const sesionesPendientes = useMemo(() => {
    return clases
      .filter(c => c.estado === 'borrador')
      .sort((a, b) => {
        if (!a.fecha_programada && !b.fecha_programada) return 0;
        if (!a.fecha_programada) return 1;
        if (!b.fecha_programada) return -1;
        return new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime();
      });
  }, [clases]);

  const sesionSugerida = useMemo(() => {
    return sesionesPendientes[0] || null;
  }, [sesionesPendientes]);

  const sesionesFiltradas = useMemo(() => {
    let filtered = sesionesPendientes.filter(s => s.id !== sesionSugerida?.id);
    
    if (filtroTema !== 'todos') {
      filtered = filtered.filter(s => s.id_tema === filtroTema);
    }
    if (filtroGrupo !== 'todos') {
      filtered = filtered.filter(s => s.id_grupo === filtroGrupo);
    }
    
    return filtered;
  }, [sesionesPendientes, sesionSugerida, filtroTema, filtroGrupo]);

  // Get all unique temas from cursos asignados for filter
  const temasDisponibles = useMemo(() => {
    const temasMap = new Map<string, { id: string; nombre: string }>();
    
    cursosConTemas.forEach(curso => {
      curso.temas.forEach(tema => {
        if (!temasMap.has(tema.id)) {
          temasMap.set(tema.id, { id: tema.id, nombre: tema.nombre });
        }
      });
    });
    
    return Array.from(temasMap.values());
  }, [cursosConTemas]);

  // Get all unique grupos from asignaciones for filter - ORDENADOS por grado
  const gruposDisponibles = useMemo(() => {
    const gruposMap = new Map<string, { id: string; nombre: string; grado: string }>();
    
    grupos.forEach(grupo => {
      if (grupo && !gruposMap.has(grupo.id)) {
        const nombre = grupo.nombre || `${grupo.grado}° ${grupo.seccion || ''}`.trim();
        gruposMap.set(grupo.id, { id: grupo.id, nombre, grado: grupo.grado });
      }
    });
    
    return Array.from(gruposMap.values())
      .sort((a, b) => {
        const numA = parseInt(a.grado?.match(/^(\d+)/)?.[1] || '0');
        const numB = parseInt(b.grado?.match(/^(\d+)/)?.[1] || '0');
        return numA - numB;
      });
  }, [grupos]);
  
  // Load initial data based on URL params
  useEffect(() => {
    const loadData = async () => {
      if (temaId && cursoId) {
        setViewMode('wizard');
        try {
          const { data: tema, error: temaError } = await supabase
            .from('temas_plan')
            .select('*')
            .eq('id', temaId)
            .single();
          
          if (temaError) throw temaError;
          setTemaData(tema);

          const { data: curso, error: cursoError } = await supabase
            .from('cursos_plan')
            .select('*')
            .eq('id', cursoId)
            .single();
          
          if (cursoError) throw cursoError;
          setCursoData(curso);

          const asignacion = asignaciones.find(a => a.id_materia === cursoId);
          if (asignacion?.grupo) {
            setGrupoData(asignacion.grupo);
            // Parse nivel/grado from grupo
            const parsed = parseGradoFromGrupo(asignacion.grupo);
            setFormData(prev => ({
              ...prev,
              nivel: (parsed.nivel as NivelEducativo) || '',
              grado: parsed.gradoNum || '',
              seccion: asignacion.grupo?.seccion || ''
            }));
          }

          if (claseId) {
            const { data: clase, error: claseError } = await supabase
              .from('clases')
              .select(`
                *,
                grupo:grupos(id, nombre, grado, seccion),
                tema:temas_plan(id, nombre)
              `)
              .eq('id', claseId)
              .single();
            
            if (!claseError && clase) {
              setClaseData(clase);
              const esExtraordinariaActual = !clase.id_tema;
              setIsExtraordinaria(esExtraordinariaActual);
              if (esExtraordinariaActual) {
                setTemaData(null);
                setCursoData(null);
              }
              
              // Parse nivel/grado from grupo if available
              if (clase.grupo) {
                const parsed = parseGradoFromGrupo(clase.grupo);
                setFormData(prev => ({
                  ...prev,
                  fecha: clase.fecha_programada || '',
                  duracion: clase.duracion_minutos || 90,
                  contexto: clase.contexto || '',
                  nivel: (parsed.nivel as NivelEducativo) || '',
                  grado: parsed.gradoNum || '',
                  seccion: clase.grupo?.seccion || '',
                  temaPersonalizado: (clase as any).tema_personalizado || ''
                }));
              } else {
                setFormData(prev => ({
                  ...prev,
                  fecha: clase.fecha_programada || '',
                  duracion: clase.duracion_minutos || 90,
                  contexto: clase.contexto || '',
                  temaPersonalizado: (clase as any).tema_personalizado || ''
                }));
              }

              if (clase.id_guia_version_actual) {
                try {
                  const { data: guia } = await supabase
                    .from('guias_clase_versiones')
                    .select('*')
                    .eq('id', clase.id_guia_version_actual)
                    .single();

                  if (guia && guia.contenido) {
                    const contenidoGuia = guia.contenido as any;
                    hydrateGuiaState(contenidoGuia);
                    setCurrentStep(2);
                  }
                } catch (error) {
                  console.error('Error loading guide:', error);
                }
              } else {
                hydrateGuiaState(null);
              }
            }
          }

          setIsLoadingData(false);
        } catch (error: any) {
          toast({
            title: 'Error',
            description: 'Error al cargar datos: ' + error.message,
            variant: 'destructive'
          });
          setIsLoadingData(false);
          setViewMode('selection');
        }
      } else if (claseId) {
        setViewMode('wizard');
        try {
          const { data: clase, error: claseError } = await supabase
            .from('clases')
            .select(`
              *,
              grupo:grupos(id, nombre, grado, seccion),
              tema:temas_plan(id, nombre, curso_plan_id)
            `)
            .eq('id', claseId)
            .single();
          
          if (claseError) throw claseError;
          
          setClaseData(clase);
          const esExtraordinariaActual = !clase.id_tema;
          setIsExtraordinaria(esExtraordinariaActual);
          
          if (clase.tema) {
            setTemaData(clase.tema);
            
            const { data: curso } = await supabase
              .from('cursos_plan')
              .select('*')
              .eq('id', clase.tema.curso_plan_id)
              .single();
            
            if (curso) setCursoData(curso);
          } else {
            setTemaData(null);
            setCursoData(null);
          }
          
          if (clase.grupo) {
            setGrupoData(clase.grupo);
            // Parse nivel/grado from grupo
            const parsed = parseGradoFromGrupo(clase.grupo);
            setFormData(prev => ({
              ...prev,
              fecha: clase.fecha_programada || '',
              duracion: clase.duracion_minutos || 90,
              contexto: clase.contexto || '',
              nivel: (parsed.nivel as NivelEducativo) || '',
              grado: parsed.gradoNum || '',
              seccion: clase.grupo?.seccion || '',
              temaPersonalizado: (clase as any).tema_personalizado || ''
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              fecha: clase.fecha_programada || '',
              duracion: clase.duracion_minutos || 90,
              contexto: clase.contexto || '',
              temaPersonalizado: (clase as any).tema_personalizado || ''
            }));
          }

          if (clase.id_guia_version_actual) {
            try {
              const { data: guia } = await supabase
                .from('guias_clase_versiones')
                .select('*')
                .eq('id', clase.id_guia_version_actual)
              .single();

              if (guia && guia.contenido) {
                const contenidoGuia = guia.contenido as any;
                hydrateGuiaState(contenidoGuia);
                setCurrentStep(2);
              }
            } catch (error) {
              console.error('Error loading guide:', error);
            }
          } else {
            hydrateGuiaState(null);
          }
          
          setIsLoadingData(false);
        } catch (error: any) {
          toast({
            title: 'Error',
            description: 'Error al cargar la clase: ' + error.message,
            variant: 'destructive'
          });
          setViewMode('selection');
          setIsLoadingData(false);
        }
      } else {
        setViewMode('selection');
        setIsLoadingData(false);
      }
    };

    if (profesorId) {
      loadData();
    }
  }, [temaId, cursoId, claseId, profesorId, asignaciones, hydrateGuiaState, toast]);

  // Effect to advance to appropriate step when data is loaded (but not if user manually navigated back)
  useEffect(() => {
    if (!isLoadingData && viewMode === 'wizard' && claseData) {
      if (currentStep === 1 && !userNavigatedBack) {
        if (guiaGenerada) {
          setCurrentStep(2);
        }
      }
    }
  }, [isLoadingData, viewMode, guiaGenerada, currentStep, claseData, userNavigatedBack]);

  // Handler: Select a session to continue
  const handleSeleccionarSesion = async (clase: Clase) => {
    setClaseData(clase);
    const esExtraordinariaActual = !clase.id_tema;
    setIsExtraordinaria(esExtraordinariaActual);
    
    if (clase.tema) {
      setTemaData(clase.tema);
      
      const { data: curso } = await supabase
        .from('cursos_plan')
        .select('*')
        .eq('id', clase.tema.curso_plan_id)
        .single();
      
      if (curso) setCursoData(curso);
    } else {
      setTemaData(null);
      setCursoData(null);
    }
    
    if (clase.grupo) {
      setGrupoData(clase.grupo);
      // Parse nivel/grado/seccion from grupo
      const parsed = parseGradoFromGrupo(clase.grupo);
      setFormData(prev => ({
        ...prev,
        fecha: clase.fecha_programada || '',
        duracion: clase.duracion_minutos || 90,
        contexto: clase.contexto || '',
        nivel: (parsed.nivel as NivelEducativo) || '',
        grado: parsed.gradoNum || '',
        seccion: clase.grupo?.seccion || '',
        temaPersonalizado: (clase as any).tema_personalizado || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        fecha: clase.fecha_programada || '',
        duracion: clase.duracion_minutos || 90,
        contexto: clase.contexto || '',
        temaPersonalizado: (clase as any).tema_personalizado || ''
      }));
    }
    
    if (clase.id_guia_version_actual) {
      try {
        const { data: guia } = await supabase
          .from('guias_clase_versiones')
          .select('*')
          .eq('id', clase.id_guia_version_actual)
          .single();
        if (guia && guia.contenido) {
          const contenidoGuia = guia.contenido as any;
          hydrateGuiaState(contenidoGuia);
        }
      } catch (error) {
        console.error('Error loading guide:', error);
      }
    } else {
      hydrateGuiaState(null);
    }
    
    setViewMode('wizard');
  };

  // Handler: Create extraordinaria class
  const handleCrearExtraordinaria = () => {
    setIsExtraordinaria(true);
    setTemaData(null);
    setCursoData(null);
    setGrupoData(null);
    setClaseData(null);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      duracion: 90,
      nivel: '',
      grado: '',
      seccion: '',
      areaAcademica: '',
      competencias: [],
      capacidadesPorCompetencia: {},
      desempenosPorCompetencia: {},
      enfoquesTransversales: [],
      materiales: [],
      materialOtro: '',
      adaptaciones: [],
      adaptacionesPersonalizadas: '',
      contexto: '',
      temaPersonalizado: ''
    });
    hydrateGuiaState(null);
    setCurrentStep(1);
    setViewMode('wizard');
  };

  // Handler: Discard a class in process
  const handleDescartar = async (claseId: string) => {
    try {
      await deleteClase.mutateAsync(claseId);
      toast({ title: 'Clase descartada' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al descartar la clase: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  // Handler: Back to selection
  const handleVolverSeleccion = () => {
    if (claseId || temaId || cursoId) {
      navigate('/profesor/dashboard');
      return;
    }
    
    setViewMode('selection');
    setIsExtraordinaria(false);
    setTemaData(null);
    setCursoData(null);
    setGrupoData(null);
    setClaseData(null);
    hydrateGuiaState(null);
    setCurrentStep(1);
  };

  // Ensure clase exists before generating
  const ensureClase = async () => {
    if (claseData) return claseData;

    // For extraordinaria classes, we need nivel/grado to find or create a group
    if (!profesorId) {
      throw new Error('Faltan datos necesarios para crear la clase (profesor)');
    }

    if (!formData.nivel || !formData.grado) {
      throw new Error('Faltan datos necesarios para crear la clase (nivel y grado)');
    }

    let groupToUse = grupoData;

    // For extraordinary classes, auto-lookup the group by nivel/grado/seccion
    if (isExtraordinaria && !groupToUse) {
      const gradoBuscado = `${formData.grado} ${formData.nivel}`;
      const { data: grupoEncontrado } = await supabase
        .from('grupos')
        .select('id, nombre, grado, seccion')
        .ilike('grado', `%${formData.grado}%${formData.nivel}%`)
        .eq('seccion', formData.seccion || '')
        .limit(1)
        .maybeSingle();

      if (grupoEncontrado) {
        groupToUse = grupoEncontrado;
        setGrupoData(grupoEncontrado);
      } else {
        throw new Error(`No se encontró un grupo para ${formData.grado}° ${formData.nivel} sección ${formData.seccion}. Contacta al administrador.`);
      }
    }

    if (!groupToUse) {
      throw new Error('Selecciona un grupo antes de continuar.');
    }

    // Para clases extraordinarias, id_tema puede ser null
    const temaIdToUse = temaData?.id || null;

    const nuevaClase = await createClase.mutateAsync({
      id_tema: temaIdToUse,
      id_grupo: groupToUse.id,
      fecha_programada: formData.fecha || new Date().toISOString().split('T')[0],
      duracion_minutos: formData.duracion,
      contexto: formData.contexto,
      tema_personalizado: isExtraordinaria ? formData.temaPersonalizado.trim() || null : null,
    });

    setClaseData(nuevaClase);
    return nuevaClase;
  };

  // Handler: Generate desempeños for a specific competencia
  const handleGenerarDesempenoParaCompetencia = async (competenciaId: string) => {
    const temaNombre = formData.temaPersonalizado?.trim() || temaData?.nombre?.trim() || '';
    
    if (!temaNombre) {
      toast({
        title: 'Tema requerido',
        description: 'Ingresa o selecciona un tema antes de generar desempeños',
        variant: 'destructive'
      });
      return;
    }
    
    const capacidadesDeCompetencia = formData.capacidadesPorCompetencia[competenciaId] || [];
    
    if (capacidadesDeCompetencia.length === 0) {
      toast({
        title: 'Selección requerida',
        description: 'Selecciona al menos una capacidad para esta competencia',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingForCompetencia(competenciaId);
    
    try {
      const areaName = areas.find(a => a.id === formData.areaAcademica)?.nombre || '';
      const competenciaData = competenciasCNEB.find(c => c.id === competenciaId);
      const capacidadesNames = capacidadesDeCompetencia
        .map(id => capacidadesCNEB.find(c => c.id === id)?.nombre)
        .filter(Boolean);

      const response = await supabase.functions.invoke('generate-desempenos', {
        body: {
          tema: temaNombre,
          nivel: formData.nivel || gradoInfo?.nivel || 'Secundaria',
          grado: formData.grado || gradoInfo?.gradoNum || '3',
          area: areaName,
          competencia: competenciaData?.nombre || '',
          capacidades: capacidadesNames
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      const desempenos = data.desempenos || [data.desempenoUnificado || ''];
      
      setFormData(prev => ({
        ...prev,
        desempenosPorCompetencia: {
          ...prev.desempenosPorCompetencia,
          [competenciaId]: desempenos
        }
      }));

      toast({
        title: 'Desempeños generados',
        description: `Se generaron ${desempenos.length} desempeño(s) para esta competencia`
      });
    } catch (error: any) {
      console.error('Error generating desempeno:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar los desempeños. Intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingForCompetencia(null);
    }
  };

  // Helper to get all capacidades for a specific competencia
  const getCapacidadesForCompetencia = (competenciaId: string) => {
    return capacidadesCNEB.filter(cap => cap.id_competencia === competenciaId);
  };

  // Toggle capacidad for a specific competencia
  const toggleCapacidadForCompetencia = (competenciaId: string, capacidadId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => {
      const currentCaps = prev.capacidadesPorCompetencia[competenciaId] || [];
      const newCaps = currentCaps.includes(capacidadId)
        ? currentCaps.filter(id => id !== capacidadId)
        : [...currentCaps, capacidadId];
      
      return {
        ...prev,
        capacidadesPorCompetencia: {
          ...prev.capacidadesPorCompetencia,
          [competenciaId]: newCaps
        }
      };
    });
  };

  // Update desempeño text for a competencia
  const updateDesempenoForCompetencia = (competenciaId: string, index: number, value: string) => {
    setFormData(prev => {
      const currentDesempenos = [...(prev.desempenosPorCompetencia[competenciaId] || [])];
      currentDesempenos[index] = value;
      return {
        ...prev,
        desempenosPorCompetencia: {
          ...prev.desempenosPorCompetencia,
          [competenciaId]: currentDesempenos
        }
      };
    });
  };

  // Add new desempeño for a competencia
  const addDesempenoForCompetencia = (competenciaId: string) => {
    setFormData(prev => ({
      ...prev,
      desempenosPorCompetencia: {
        ...prev.desempenosPorCompetencia,
        [competenciaId]: [...(prev.desempenosPorCompetencia[competenciaId] || []), '']
      }
    }));
  };

  // Remove desempeño from a competencia
  const removeDesempenoFromCompetencia = (competenciaId: string, index: number) => {
    setFormData(prev => {
      const currentDesempenos = [...(prev.desempenosPorCompetencia[competenciaId] || [])];
      currentDesempenos.splice(index, 1);
      return {
        ...prev,
        desempenosPorCompetencia: {
          ...prev.desempenosPorCompetencia,
          [competenciaId]: currentDesempenos
        }
      };
    });
  };

  // Toggle competencia selection
  const toggleCompetencia = (competenciaId: string) => {
    if (isClaseCompletada) return;
    
    setFormData(prev => {
      const isSelected = prev.competencias.includes(competenciaId);
      
      if (isSelected) {
        // Remove competencia and its capacidades/desempeños
        const { [competenciaId]: removedCaps, ...restCaps } = prev.capacidadesPorCompetencia;
        const { [competenciaId]: removedDesempenos, ...restDesempenos } = prev.desempenosPorCompetencia;
        
        return {
          ...prev,
          competencias: prev.competencias.filter(id => id !== competenciaId),
          capacidadesPorCompetencia: restCaps,
          desempenosPorCompetencia: restDesempenos
        };
      } else {
        // Add competencia
        return {
          ...prev,
          competencias: [...prev.competencias, competenciaId],
          capacidadesPorCompetencia: {
            ...prev.capacidadesPorCompetencia,
            [competenciaId]: []
          },
          desempenosPorCompetencia: {
            ...prev.desempenosPorCompetencia,
            [competenciaId]: []
          }
        };
      }
    });
  };

  const handleGenerarGuia = async () => {
    const temaNombre = formData.temaPersonalizado || temaData?.nombre;
    
    if (!temaNombre) {
      toast({
        title: 'Error',
        description: 'Ingresa el nombre del tema antes de continuar',
        variant: 'destructive'
      });
      return;
    }

    // Validate nivel/grado for extraordinaria classes
    if (isExtraordinaria && (!formData.nivel || !formData.grado)) {
      toast({
        title: 'Error',
        description: 'Selecciona nivel y grado antes de continuar',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    let claseIdEnProceso: string | null = claseData?.id || null;
    try {
      const clase = await ensureClase();
      claseIdEnProceso = clase.id;
      const materialesSeleccionados = formData.materialOtro.trim()
        ? [...formData.materiales, formData.materialOtro.trim()]
        : formData.materiales;
      
      const claseGenerando = await updateClase.mutateAsync({
        id: clase.id,
        estado: 'generando_clase',
        contexto: formData.contexto,
        silent: true,
      });
      setClaseData((prev: any) => ({ ...prev, ...claseGenerando }));

      const guia = await generateGuiaClase(
        temaNombre,
        formData.contexto,
        materialesSeleccionados,
        {
          grado: isExtraordinaria 
            ? (formData.nivel === 'Inicial' ? `${formData.grado} años` : `${formData.grado}° ${formData.nivel}`)
            : (gradoInfo?.gradoCompleto || grupoData?.grado),
          nivel: formData.nivel || gradoInfo?.nivel,
          seccion: formData.seccion || grupoData?.seccion,
          numeroEstudiantes: grupoData?.cantidad_alumnos,
          duracion: formData.duracion,
          area: cursoData?.nombre || areas.find(a => a.id === formData.areaAcademica)?.nombre,
        competenciasConDesempenos: formData.competencias.map(compId => {
            const comp = competenciasCNEB.find(c => c.id === compId);
            const capsIds = formData.capacidadesPorCompetencia[compId] || [];
            const capsNames = capsIds.map(capId => capacidadesCNEB.find(c => c.id === capId)?.nombre || '').filter(Boolean);
            const desempenos = formData.desempenosPorCompetencia[compId] || [];
            return {
              competencia: comp?.nombre || '',
              capacidades: capsNames,
              desempenos: desempenos.filter(d => d.trim() !== '')
            };
          }),
          enfoquesTransversales: formData.enfoquesTransversales
            .map(id => enfoques.find(e => e.id === id)?.nombre)
            .filter(Boolean) as string[],
          adaptaciones: formData.adaptaciones.map(id => tiposAdaptacion.find(t => t.id === id)?.nombre || ''),
          adaptacionesPersonalizadas: formData.adaptacionesPersonalizadas,
          materiales: materialesSeleccionados
        }
      );

      setGuiaGenerada(guia);

      const guiaVersion = await createGuiaVersion.mutateAsync({
        id_clase: clase.id,
        objetivos: guia.propositos_aprendizaje.map(p => p.competencia).join('\n'),
        estructura: guia.momentos_sesion,
        contenido: guia,
        preguntas_socraticas: [],
        generada_ia: true,
        estado: 'borrador'
      });

      const claseEditando = await updateClase.mutateAsync({
        id: clase.id,
        estado: 'editando_guia',
        id_guia_version_actual: guiaVersion.id,
        silent: true,
      });
      setClaseData((prev: any) => ({ ...prev, ...claseEditando }));

      // Mark the generated guide as the latest persisted snapshot.
      lastSavedSnapshotRef.current = serializeGuia(guia);
      setGuiaSaveStatus('saved');
      setGuiaLastSavedAt(new Date());
      setGuiaSaveError(null);

      toast({ title: '¡Guía generada!', description: 'La guía de clase ha sido creada con éxito' });
      setCurrentStep(2);
    } catch (error: any) {
      if (claseIdEnProceso) {
        try {
          const claseRollback = await updateClase.mutateAsync({
            id: claseIdEnProceso,
            estado: 'borrador',
            silent: true,
          });
          setClaseData((prev: any) => ({ ...prev, ...claseRollback }));
        } catch (rollbackError) {
          console.error('Error rolling back clase state:', rollbackError);
        }
      }
      toast({
        title: 'Error',
        description: 'Error al generar la guía: ' + error.message,
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleValidar = async () => {
    if (!guiaGenerada || !claseData) {
      toast({ 
        title: 'Pasos incompletos', 
        description: 'Debes generar la guía de clase primero',
        variant: 'destructive'
      });
      return;
    }

    try {
      const saved = await flushPendingGuiaSave();
      if (!saved) {
        toast({
          title: 'No se pudo guardar la guía',
          description: 'Corrige los errores de guardado antes de validar.',
          variant: 'destructive'
        });
        return;
      }

      await updateClase.mutateAsync({
        id: claseData.id,
        estado: 'clase_programada',
        silent: true,
      });

      toast({ title: '¡Clase validada!', description: 'Tu clase está lista para ser impartida' });
      navigate('/profesor/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Error al validar la clase: ' + error.message,
        variant: 'destructive'
      });
    }
  };

  // Validation helper using utility function
  const getMissingFields = () => {
    return getMissingFieldsUtil(formData, isExtraordinaria, temaData, grupoData);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return getMissingFields().length === 0;
      case 2:
        return guiaGenerada !== null;
      default:
        return true;
    }
  };

  const guiaSaveMessage = useMemo(() => {
    if (!claseData?.id_guia_version_actual || !guiaGenerada || isClaseCompletada) {
      return null;
    }

    if (guiaSaveStatus === 'saving') {
      return { text: 'Guardando...', tone: 'muted' as const };
    }

    if (guiaSaveStatus === 'error') {
      return { text: guiaSaveError || 'Error al guardar', tone: 'error' as const };
    }

    if (guiaSaveStatus === 'saved' && guiaLastSavedAt) {
      return { text: `Guardado ${formatRelativeTime(guiaLastSavedAt)}`, tone: 'success' as const };
    }

    return null;
  }, [claseData?.id_guia_version_actual, guiaGenerada, guiaLastSavedAt, guiaSaveError, guiaSaveStatus, isClaseCompletada]);

  // Note: formatDate and getEstadoLabel are now imported from utils

  // Render SELECTION MODE
  const renderSelectionMode = () => {
    if (clasesLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Seleccionar Clase para Generar
          </h1>
          <p className="text-muted-foreground">
            Elige una clase programada o crea una clase extraordinaria.
          </p>
        </div>

        {/* Clases en Proceso */}
        {clasesEnProceso.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-3">
                {clasesEnProceso.map((claseEnProceso) => (
                  <div key={claseEnProceso.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-primary font-medium">Clase en proceso</p>
                        <p className="font-semibold">
                          {claseEnProceso.tema?.nombre || (claseEnProceso as any).tema_personalizado || 'Sin tema'} • {claseEnProceso.grupo?.grado}° {claseEnProceso.grupo?.seccion || ''}
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {getEstadoLabel(claseEnProceso.estado)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleDescartar(claseEnProceso.id)}
                      >
                        Descartar
                      </Button>
                      <Button 
                        variant="gradient"
                        onClick={() => handleSeleccionarSesion(claseEnProceso)}
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filtrar por Tema</Label>
            <Select value={filtroTema} onValueChange={setFiltroTema}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los temas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los temas</SelectItem>
                {temasDisponibles.map(tema => (
                  <SelectItem key={tema.id} value={tema.id}>{tema.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Filtrar por Grupo</Label>
            <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los grupos</SelectItem>
                {gruposDisponibles.map(grupo => (
                  <SelectItem key={grupo.id} value={grupo.id}>{grupo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Siguiente Clase Sugerida */}
        {sesionSugerida && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Siguiente Clase Sugerida</p>
                  <p className="font-semibold">
                    {sesionSugerida.tema?.nombre || 'Sin tema'} - Clase {sesionSugerida.numero_sesion || 1}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <Badge variant="outline">{getEstadoLabel(sesionSugerida.estado)}</Badge>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(sesionSugerida.fecha_programada)}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="default"
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => handleSeleccionarSesion(sesionSugerida)}
                >
                  Usar Esta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Clases */}
        {sesionesFiltradas.length > 0 && (
          <div className="space-y-3">
            {sesionesFiltradas.map((sesion) => (
              <Card key={sesion.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Clase {sesion.numero_sesion || 1}
                        </span>
                        <span className="font-semibold">{sesion.tema?.nombre || 'Sin tema'}</span>
                        <Badge variant="secondary">{getEstadoLabel(sesion.estado)}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {sesion.grupo?.nombre || `${sesion.grupo?.grado}° ${sesion.grupo?.seccion || ''}`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(sesion.fecha_programada)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost"
                      onClick={() => handleSeleccionarSesion(sesion)}
                    >
                      Seleccionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!sesionSugerida && sesionesFiltradas.length === 0 && clasesEnProceso.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No hay clases pendientes. Crea una clase extraordinaria o programa clases desde Planificación.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Clase Extraordinaria */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Crear Clase Extraordinaria</p>
                <p className="text-sm text-muted-foreground">
                  Tema libre, grupo obligatorio
                </p>
              </div>
              <Button variant="outline" onClick={handleCrearExtraordinaria}>
                <Sparkles className="w-4 h-4 mr-2" />
                Nueva Clase
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render WIZARD MODE
  const renderWizardMode = () => {
    if (isLoadingData) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando datos...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!isExtraordinaria && !temaData && !claseData) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No se pudieron cargar los datos necesarios. Por favor, vuelve a la selección.
              </p>
              <Button onClick={handleVolverSeleccion} className="mt-4">
                Volver a Selección
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const totalSteps = STEPS.length;
    const progress = (currentStep / totalSteps) * 100;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleVolverSeleccion}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              {isExtraordinaria ? 'Crear Clase Extraordinaria' : 'Generar Clase con IA'}
            </h1>
            <p className="text-muted-foreground">
              Crea clases centradas en el desarrollo del pensamiento crítico
            </p>
            {isExtraordinaria && (
              <Badge variant="outline" className="mt-2">
                Tema libre, grupo obligatorio
              </Badge>
            )}
          </div>
        </div>

        {/* Progress - Using refactored component */}
        <WizardProgress 
          currentStep={currentStep}
          sectionProgress={currentStep === 1 ? sectionProgress : undefined}
        />


        {/* Step content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Context */}
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Read-only mode banner for completed classes */}
                {isClaseCompletada && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Lock className="w-5 h-5" />
                      <span className="font-medium">Modo solo lectura - Esta clase está completada</span>
                    </div>
                  </div>
                )}
                
                {/* SECCIÓN 1: DATOS - Diseño mejorado con borde izquierdo */}
                <fieldset className="p-5 border-l-4 border-l-primary/60 border border-border rounded-lg space-y-4 bg-card shadow-sm">
                  <legend className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-md flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Datos
                  </legend>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Tema */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Tema * {!isExtraordinaria && <Lock className="w-3 h-3 text-muted-foreground" />}
                      </Label>
                      {isExtraordinaria ? (
                        <Input 
                          value={formData.temaPersonalizado} 
                          onChange={(e) => setFormData({...formData, temaPersonalizado: e.target.value})}
                          placeholder="Escribe el tema de la clase"
                          disabled={isClaseCompletada}
                        />
                      ) : (
                        <Input value={temaData?.nombre || ''} disabled />
                      )}
                    </div>

                    {/* Duración - Horas Pedagógicas */}
                    <div className="space-y-2">
                      <Label>Duración del momento de la sesión *</Label>
                      <Select 
                        value={String(formData.duracion)} 
                        onValueChange={(value) => setFormData({...formData, duracion: parseInt(value)})}
                        disabled={isClaseCompletada}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {(() => {
                              const horaSeleccionada = HORAS_PEDAGOGICAS.find(hp => hp.minutos === formData.duracion);
                              if (!horaSeleccionada) return 'Seleccionar duración';
                              return `${horaSeleccionada.horas} ${horaSeleccionada.horas === 1 ? 'hora pedagógica' : 'horas pedagógicas'} (${formData.duracion} min)`;
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {HORAS_PEDAGOGICAS.map(hp => (
                            <SelectItem key={hp.minutos} value={String(hp.minutos)}>
                              {hp.horas} {hp.horas === 1 ? 'hora pedagógica' : 'horas pedagógicas'} ({hp.minutos} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Nivel Educativo */}
                    <div className="space-y-2">
                      <Label>Nivel *</Label>
                      <Select 
                        value={formData.nivel} 
                        onValueChange={(value: NivelEducativo) => {
                          // Reset dependent fields when nivel changes
                          setFormData({
                            ...formData, 
                            nivel: value,
                            grado: '',
                            seccion: '',
                            areaAcademica: '',
                            competencias: [],
                            capacidadesPorCompetencia: {},
                            desempenosPorCompetencia: {}
                          });
                          // Also try to find a matching group
                          setGrupoData(null);
                        }}
                        disabled={isClaseCompletada || !isExtraordinaria}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona nivel" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inicial">Inicial</SelectItem>
                          <SelectItem value="Primaria">Primaria</SelectItem>
                          <SelectItem value="Secundaria">Secundaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Grado */}
                    <div className="space-y-2">
                      <Label>Grado *</Label>
                      <Select 
                        value={formData.grado} 
                        onValueChange={(value) => {
                          setFormData({...formData, grado: value});
                        }}
                        disabled={isClaseCompletada || !formData.nivel || !isExtraordinaria}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.nivel ? "Selecciona grado" : "Primero selecciona nivel"} />
                        </SelectTrigger>
                        <SelectContent>
                          {getGradosForNivel(formData.nivel).map(g => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sección */}
                    <div className="space-y-2">
                      <Label>Sección</Label>
                      <Select 
                        value={formData.seccion} 
                        onValueChange={(value) => setFormData({...formData, seccion: value})}
                        disabled={isClaseCompletada || !formData.grado || !isExtraordinaria}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECCIONES_DISPONIBLES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Fecha */}
                    <div className="space-y-2">
                      <Label>Fecha programada *</Label>
                      <DatePicker
                        value={formData.fecha}
                        onChange={(value) => setFormData({...formData, fecha: value})}
                        placeholder="Selecciona una fecha"
                        disabled={isClaseCompletada}
                      />
                    </div>
                  </div>

                  {/* Para clases NO extraordinarias, mostrar info del grupo actual */}
                  {!isExtraordinaria && grupoData && (
                    <div className="flex gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <span><strong>Nivel:</strong> {gradoInfo?.nivel || 'N/A'}</span>
                      <span><strong>Grado:</strong> {gradoInfo?.gradoNum || 'N/A'}°</span>
                      <span><strong>Sección:</strong> {grupoData.seccion || 'N/A'}</span>
                    </div>
                  )}

                  {/* Área Curricular */}
                  <div className="space-y-2">
                    <Label>Área Curricular *</Label>
                    <Select 
                      value={formData.areaAcademica} 
                      onValueChange={(value) => setFormData({...formData, areaAcademica: value, competencias: [], capacidadesPorCompetencia: {}, desempenosPorCompetencia: {}})}
                      disabled={isClaseCompletada || (!formData.nivel && isExtraordinaria)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isExtraordinaria && !formData.nivel ? "Primero selecciona nivel" : "Selecciona un área"} />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(area => (
                          <SelectItem key={area.id} value={area.id}>{area.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </fieldset>

                {/* SECCIÓN 2: PROPÓSITOS DE APRENDIZAJE - Diseño mejorado */}
                <fieldset className="p-5 border-l-4 border-l-primary/60 border border-border rounded-lg space-y-4 bg-card shadow-sm">
                  <legend className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-md flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Propósitos de Aprendizaje
                  </legend>
                  
                  {/* Selección de Competencias - Nuevo diseño con Popover */}
                  <div className="space-y-2">
                    <Label>Competencias *</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background min-h-[48px] items-center">
                      {/* Mostrar competencias seleccionadas */}
                      {formData.competencias.map(compId => {
                        const comp = competenciasCNEB.find(c => c.id === compId);
                        if (!comp) return null;
                        return (
                          <Badge
                            key={compId}
                            variant="default"
                            className="text-xs flex items-center gap-1 pr-1"
                          >
                            <span className="max-w-[200px] truncate">{comp.nombre}</span>
                            {!isClaseCompletada && (
                              <button
                                type="button"
                                onClick={() => toggleCompetencia(compId)}
                                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                      
                      {/* Botón para agregar competencias */}
                      {!isClaseCompletada && formData.areaAcademica && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                              <Plus className="w-3 h-3" />
                              Agregar
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <ScrollArea className="max-h-[250px]">
                              <div className="divide-y divide-border/50">
                                {competenciasCNEB.filter(c => !formData.competencias.includes(c.id)).map(comp => (
                                  <button
                                    key={comp.id}
                                    type="button"
                                    onClick={() => toggleCompetencia(comp.id)}
                                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted/70 transition-colors first:rounded-t last:rounded-b"
                                  >
                                    {comp.nombre}
                                  </button>
                                ))}
                                {competenciasCNEB.filter(c => !formData.competencias.includes(c.id)).length === 0 && (
                                  <p className="text-xs text-muted-foreground p-3">Todas las competencias ya están seleccionadas</p>
                                )}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      )}
                      
                      {!formData.areaAcademica && (
                        <span className="text-sm text-muted-foreground">Primero selecciona un área académica</span>
                      )}
                    </div>
                  </div>

                  {/* Secciones expandidas por competencia seleccionada */}
                  {formData.competencias.length > 0 && (
                    <div className="space-y-4">
                      {formData.competencias.map(compId => {
                        const comp = competenciasCNEB.find(c => c.id === compId);
                        const capsForComp = getCapacidadesForCompetencia(compId);
                        
                        return (
                          <CompetenciaSection
                            key={compId}
                            competenciaId={compId}
                            competenciaNombre={comp?.nombre || ''}
                            capacidades={capsForComp}
                            selectedCapacidades={formData.capacidadesPorCompetencia[compId] || []}
                            desempenos={formData.desempenosPorCompetencia[compId] || []}
                            isGenerating={generatingForCompetencia === compId}
                            isClaseCompletada={isClaseCompletada}
                            onToggleCapacidad={(capId) => toggleCapacidadForCompetencia(compId, capId)}
                            onGenerarDesempenos={() => handleGenerarDesempenoParaCompetencia(compId)}
                            onUpdateDesempeno={(idx, value) => updateDesempenoForCompetencia(compId, idx, value)}
                            onAddDesempeno={() => addDesempenoForCompetencia(compId)}
                            onRemoveDesempeno={(idx) => removeDesempenoFromCompetencia(compId, idx)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {formData.competencias.length === 0 && formData.areaAcademica && (
                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                      Usa el botón "Agregar" para seleccionar competencias
                    </p>
                  )}

                  {/* Enfoques Transversales - Nuevo diseño con Popover */}
                  <div className="space-y-2">
                    <Label>Enfoques Transversales *</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background min-h-[48px] items-center">
                      {/* Mostrar enfoques seleccionados */}
                      {formData.enfoquesTransversales.map(enfoqueId => {
                        const enfoque = enfoques.find(e => e.id === enfoqueId);
                        if (!enfoque) return null;
                        return (
                          <Badge
                            key={enfoqueId}
                            variant="default"
                            className="text-xs flex items-center gap-1 pr-1"
                          >
                            <span>{enfoque.nombre}</span>
                            {!isClaseCompletada && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    enfoquesTransversales: formData.enfoquesTransversales.filter(id => id !== enfoqueId)
                                  });
                                }}
                                className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        );
                      })}
                      
                      {/* Botón para agregar enfoques */}
                      {!isClaseCompletada && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                              <Plus className="w-3 h-3" />
                              Agregar
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0" align="start">
                            <ScrollArea className="max-h-[250px]">
                              <div className="divide-y divide-border/50">
                                {enfoques.filter(e => !formData.enfoquesTransversales.includes(e.id)).map(enfoque => (
                                  <button
                                    key={enfoque.id}
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        enfoquesTransversales: [...formData.enfoquesTransversales, enfoque.id]
                                      });
                                    }}
                                    className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted/70 transition-colors first:rounded-t last:rounded-b"
                                  >
                                    {enfoque.nombre}
                                  </button>
                                ))}
                                {enfoques.filter(e => !formData.enfoquesTransversales.includes(e.id)).length === 0 && (
                                  <p className="text-xs text-muted-foreground p-3">Todos los enfoques ya están seleccionados</p>
                                )}
                              </div>
                            </ScrollArea>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </fieldset>

                {/* SECCIÓN 3: MATERIALES DISPONIBLES - Diseño mejorado */}
                <fieldset className="p-5 border-l-4 border-l-primary/60 border border-border rounded-lg space-y-4 bg-card shadow-sm">
                  <legend className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-md flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Materiales Disponibles *
                  </legend>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MATERIALES_DISPONIBLES.map(mat => (
                      <div key={mat.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mat-${mat.id}`}
                          checked={formData.materiales.includes(mat.id)}
                          onCheckedChange={(checked) => {
                            if (!isClaseCompletada) {
                              const newMats = checked 
                                ? [...formData.materiales, mat.id]
                                : formData.materiales.filter(m => m !== mat.id);
                              setFormData({...formData, materiales: newMats});
                            }
                          }}
                          disabled={isClaseCompletada}
                        />
                        <Label htmlFor={`mat-${mat.id}`} className="cursor-pointer text-sm">{mat.nombre}</Label>
                      </div>
                    ))}
                  </div>
                  
                  {/* Otro material - Colapsable */}
                  {!isClaseCompletada && (
                    <>
                      {showMaterialOtro || formData.materialOtro ? (
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="Especifica otros materiales..."
                            value={formData.materialOtro}
                            onChange={(e) => setFormData({...formData, materialOtro: e.target.value})}
                            className="flex-1"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setFormData({...formData, materialOtro: ''});
                              setShowMaterialOtro(false);
                            }}
                            className="h-9 w-9"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowMaterialOtro(true)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar otro material
                        </Button>
                      )}
                    </>
                  )}
                  {isClaseCompletada && formData.materialOtro && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Otro:</span> {formData.materialOtro}
                    </div>
                  )}
                </fieldset>

                {/* SECCIÓN 4: ADAPTACIONES - Diseño mejorado */}
                <fieldset className="p-5 border-l-4 border-l-primary/60 border border-border rounded-lg space-y-4 bg-card shadow-sm">
                  <legend className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-md flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Adaptaciones (NEE)
                  </legend>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {adaptacionesFiltradas.map(tipo => (
                      <div key={tipo.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`adapt-${tipo.id}`}
                          checked={formData.adaptaciones.includes(tipo.id)}
                          onCheckedChange={(checked) => {
                            if (!isClaseCompletada) {
                              const newAdapts = checked 
                                ? [...formData.adaptaciones, tipo.id]
                                : formData.adaptaciones.filter(a => a !== tipo.id);
                              setFormData({...formData, adaptaciones: newAdapts});
                            }
                          }}
                          disabled={isClaseCompletada}
                        />
                        <Label htmlFor={`adapt-${tipo.id}`} className="cursor-pointer text-sm">{tipo.nombre}</Label>
                      </div>
                    ))}
                  </div>

                  {/* Adaptación personalizada - Colapsable */}
                  {!isClaseCompletada && (
                    <>
                      {showAdaptacionOtro || formData.adaptacionesPersonalizadas ? (
                        <div className="flex gap-2 items-start">
                          <Textarea 
                            placeholder="Describe adaptaciones específicas para estudiantes con NEE..."
                            value={formData.adaptacionesPersonalizadas}
                            onChange={(e) => setFormData({...formData, adaptacionesPersonalizadas: e.target.value})}
                            rows={2}
                            className="flex-1"
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              setFormData({...formData, adaptacionesPersonalizadas: ''});
                              setShowAdaptacionOtro(false);
                            }}
                            className="h-9 w-9 mt-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAdaptacionOtro(true)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Agregar adaptación personalizada
                        </Button>
                      )}
                    </>
                  )}
                  {isClaseCompletada && formData.adaptacionesPersonalizadas && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Personalizada:</span> {formData.adaptacionesPersonalizadas}
                    </div>
                  )}
                </fieldset>

                {/* SECCIÓN 5: CONTEXTO - Diseño mejorado */}
                <fieldset className="p-5 border-l-4 border-l-primary/60 border border-border rounded-lg space-y-4 bg-card shadow-sm">
                  <legend className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-md flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary" />
                    Contexto Adicional
                  </legend>
                  
                  <div className="space-y-2">
                    <Label>Contexto del grupo (opcional)</Label>
                    <Textarea 
                      placeholder="Describe características particulares del grupo, intereses, conocimientos previos..."
                      value={formData.contexto}
                      onChange={(e) => setFormData({...formData, contexto: e.target.value})}
                      rows={3}
                      disabled={isClaseCompletada}
                    />
                  </div>
                </fieldset>
              </div>
            )}

            {/* Step 2: Guía de Clase */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {guiaSaveMessage && (
                  <div className={`text-xs ${
                    guiaSaveMessage.tone === 'error'
                      ? 'text-destructive'
                      : guiaSaveMessage.tone === 'success'
                        ? 'text-emerald-700'
                        : 'text-muted-foreground'
                  }`}>
                    {guiaSaveMessage.text}
                  </div>
                )}

                {/* Read-only mode banner for completed classes */}
                {isClaseCompletada && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Lock className="w-5 h-5" />
                      <span className="font-medium">Modo solo lectura - Esta clase está completada</span>
                    </div>
                  </div>
                )}

                {isGenerating ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                    <h2 className="text-lg font-semibold mb-2">Generando Guía de Clase</h2>
                    <p className="text-muted-foreground">
                      El Arquitecto Pedagógico está creando tu experiencia de aprendizaje...
                    </p>
                  </div>
                ) : !guiaGenerada ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay guía generada. Vuelve al paso anterior.
                    </p>
                    {!isClaseCompletada && (
                      <Button variant="outline" className="mt-4" onClick={() => setCurrentStep(1)}>
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Volver a Contexto
                      </Button>
                    )}
                  </div>
                ) : null}

                {guiaGenerada && (
                  <GuiaClaseViewer 
                    guia={guiaGenerada}
                    duracion={formData.duracion}
                    isLoaded={!!claseData?.id_guia_version_actual}
                    onGuiaChange={handleGuiaChange}
                    readOnly={isClaseCompletada}
                  />
                )}
              </div>
            )}

            {/* Step 3: Validar - Using extracted component */}
            {currentStep === 3 && (
              <ValidacionStep 
                guiaGenerada={guiaGenerada}
                isClaseCompletada={isClaseCompletada}
              />
            )}
          </CardContent>
        </Card>

        {/* Validation message */}
        {currentStep === 1 && !canProceed() && !isClaseCompletada && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <p className="font-medium">Completa los campos obligatorios (*) para continuar:</p>
            <ul className="list-disc list-inside mt-1 text-xs">
              {getMissingFields().map((field, i) => (
                <li key={i}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        {currentStep === 2 && guiaSaveMessage && (
          <div className={`text-xs text-right ${
            guiaSaveMessage.tone === 'error'
              ? 'text-destructive'
              : guiaSaveMessage.tone === 'success'
                ? 'text-emerald-700'
                : 'text-muted-foreground'
          }`}>
            {guiaSaveMessage.text}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              setUserNavigatedBack(true);
              setCurrentStep(Math.max(1, currentStep - 1));
            }}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < 3 ? (
            currentStep === 1 ? (
              guiaGenerada ? (
                <Button 
                  variant="gradient"
                  onClick={() => {
                    setUserNavigatedBack(false);
                    setCurrentStep(2);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Guía
                </Button>
              ) : (
                <Button 
                  variant="gradient"
                  onClick={handleGenerarGuia}
                  disabled={!canProceed() || isGenerating || isClaseCompletada}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generar Guía
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button 
                variant="gradient"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceed()}
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )
          ) : (
            !isClaseCompletada && (
              <Button 
                variant="gradient"
                onClick={handleValidar}
                disabled={!guiaGenerada}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Validar Clase
              </Button>
            )
          )}
        </div>
      </div>
    );
  };

  // Main render
  return viewMode === 'selection' ? renderSelectionMode() : renderWizardMode();
}
