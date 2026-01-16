import { useState, useEffect, useMemo } from 'react';
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
import { useClases, type Clase } from '@/hooks/useClases';
import { useGuiasClase } from '@/hooks/useGuias';
import { useTemasProfesor } from '@/hooks/useTemasProfesor';
import { useAreasCurriculares } from '@/hooks/useAreasCurriculares';
import { useCompetenciasCNEB } from '@/hooks/useCompetenciasCNEB';
import { useCapacidadesCNEB } from '@/hooks/useCapacidadesCNEB';
import { useEnfoquesTransversales } from '@/hooks/useEnfoquesTransversales';
import { useTiposAdaptacion } from '@/hooks/useTiposAdaptacion';
import { useAutosave } from '@/hooks/useAutosave';
import { supabase } from '@/integrations/supabase/client';
import { generateGuiaClase, type GuiaClaseData } from '@/lib/ai/generate';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Target,
  FileCheck,
  Loader2,
  Info,
  Lock,
  Heart,
  Clock,
  Lightbulb,
  Eye,
  Settings,
  Calendar,
  Users,
  GraduationCap,
  Wand2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Import refactored components
import {
  STEPS,
  MATERIALES_DISPONIBLES,
  DURACIONES,
  STORAGE_KEYS,
  parseGradoFromGrupo,
  getInitialFormData,
  getMissingFields,
  calculateSectionProgress,
  type FormData,
  type ViewMode
} from '@/components/profesor/GenerarClase';
import { WizardProgress } from '@/components/profesor/GenerarClase/WizardProgress';
import { CompetenciaSection } from '@/components/profesor/GenerarClase/CompetenciaSection';
import { DraftRestoreDialog } from '@/components/profesor/GenerarClase/DraftRestoreDialog';
import { SelectionMode } from '@/components/profesor/GenerarClase/SelectionMode';

export default function GenerarClase() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { profesorId } = useProfesor();
  const { asignaciones, grupos, cursos } = useAsignaciones('2025');
  const { clases, isLoading: clasesLoading, deleteClase } = useClases();
  const { cursosConTemas } = useTemasProfesor('2025');
  
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
  
  // Data from DB
  const [temaData, setTemaData] = useState<any>(null);
  const [cursoData, setCursoData] = useState<any>(null);
  const [grupoData, setGrupoData] = useState<any>(null);
  const [claseData, setClaseData] = useState<any>(null);
  
  // Check if class is completed (read-only mode)
  const isClaseCompletada = claseData?.estado === 'completada';
  
  // Form state - now with desempeños per competencia
  const [formData, setFormData] = useState({
    fecha: '',
    duracion: 55,
    areaAcademica: '' as string,
    // Propósitos de aprendizaje - NUEVA ESTRUCTURA
    competencias: [] as string[],
    capacidadesPorCompetencia: {} as Record<string, string[]>,  // { competenciaId: [capacidadIds] }
    desempenosPorCompetencia: {} as Record<string, string[]>,   // { competenciaId: [desempeños] }
    enfoqueTransversal: '' as string,
    // Materiales
    materiales: [] as string[],
    materialOtro: '' as string,
    // Adaptaciones
    adaptaciones: [] as string[],
    adaptacionesPersonalizadas: '' as string,
    // Legacy/Extraordinaria
    contexto: '',
    temaPersonalizado: ''
  });
  
  // State for tracking which competencia is generating desempeños
  const [generatingForCompetencia, setGeneratingForCompetencia] = useState<string | null>(null);

  // CNEB Data hooks
  const { areas } = useAreasCurriculares();
  const { competencias: competenciasCNEB } = useCompetenciasCNEB(formData.areaAcademica);
  const { capacidades: capacidadesCNEB } = useCapacidadesCNEB(formData.competencias);
  const { enfoques } = useEnfoquesTransversales();
  const { tiposAdaptacion } = useTiposAdaptacion();

  // Generated content
  const [guiaGenerada, setGuiaGenerada] = useState<GuiaClaseData | null>(null);
  
  // Hooks for DB operations
  const { createClase, updateClase } = useClases();
  const { createGuiaVersion } = useGuiasClase(claseData?.id);

  // Derived grado info from grupo
  const gradoInfo = useMemo(() => 
    grupoData ? parseGradoFromGrupo(grupoData) : null, 
    [grupoData]
  );

  // Computed data for selection mode
  const clasesEnProceso = useMemo(() => {
    return clases.filter(c => 
      ['generando_clase', 'editando_guia'].includes(c.estado)
    );
  }, [clases]);

  const claseEnEdicion = useMemo(() => {
    return clasesEnProceso[0] || null;
  }, [clasesEnProceso]);

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
              setFormData(prev => ({
                ...prev,
                fecha: clase.fecha_programada || '',
                duracion: clase.duracion_minutos || 55,
                contexto: clase.contexto || ''
              }));

              if (clase.id_guia_version_actual) {
                try {
                  const { data: guia } = await supabase
                    .from('guias_clase_versiones')
                    .select('*')
                    .eq('id', clase.id_guia_version_actual)
                    .single();

                  if (guia && guia.contenido) {
                    const contenidoGuia = guia.contenido as any;
                    setGuiaGenerada(contenidoGuia);
                    setCurrentStep(2);
                  }
                } catch (error) {
                  console.error('Error loading guide:', error);
                }
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
          
          if (clase.tema) {
            setTemaData(clase.tema);
            
            const { data: curso } = await supabase
              .from('cursos_plan')
              .select('*')
              .eq('id', clase.tema.curso_plan_id)
              .single();
            
            if (curso) setCursoData(curso);
          }
          
          if (clase.grupo) {
            setGrupoData(clase.grupo);
          }
          
          setFormData(prev => ({
            ...prev,
            fecha: clase.fecha_programada || '',
            duracion: clase.duracion_minutos || 55,
            contexto: clase.contexto || ''
          }));

          if (clase.id_guia_version_actual) {
            try {
              const { data: guia } = await supabase
                .from('guias_clase_versiones')
                .select('*')
                .eq('id', clase.id_guia_version_actual)
                .single();

              if (guia && guia.contenido) {
                const contenidoGuia = guia.contenido as any;
                setGuiaGenerada(contenidoGuia);
                setCurrentStep(2);
              }
            } catch (error) {
              console.error('Error loading guide:', error);
            }
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
  }, [temaId, cursoId, claseId, profesorId, asignaciones]);

  // Effect to advance to appropriate step when data is loaded
  useEffect(() => {
    if (!isLoadingData && viewMode === 'wizard' && claseData) {
      if (currentStep === 1) {
        if (guiaGenerada) {
          setCurrentStep(2);
        }
      }
    }
  }, [isLoadingData, viewMode, guiaGenerada, currentStep, claseData]);

  // Handler: Select a session to continue
  const handleSeleccionarSesion = async (clase: Clase) => {
    setClaseData(clase);
    
    if (clase.tema) {
      setTemaData(clase.tema);
      
      const { data: curso } = await supabase
        .from('cursos_plan')
        .select('*')
        .eq('id', clase.tema.curso_plan_id)
        .single();
      
      if (curso) setCursoData(curso);
    }
    
    if (clase.grupo) {
      setGrupoData(clase.grupo);
    }
    
    setFormData(prev => ({
      ...prev,
      fecha: clase.fecha_programada || '',
      duracion: clase.duracion_minutos || 55,
      contexto: clase.contexto || ''
    }));
    
    if (clase.id_guia_version_actual) {
      try {
        const { data: guia } = await supabase
          .from('guias_clase_versiones')
          .select('*')
          .eq('id', clase.id_guia_version_actual)
          .single();
        if (guia && guia.contenido) {
          const contenidoGuia = guia.contenido as any;
          setGuiaGenerada(contenidoGuia);
        }
      } catch (error) {
        console.error('Error loading guide:', error);
      }
    }
    
    setIsExtraordinaria(false);
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
      duracion: 55,
      areaAcademica: '',
      competencias: [],
      capacidadesPorCompetencia: {},
      desempenosPorCompetencia: {},
      enfoqueTransversal: '',
      materiales: [],
      materialOtro: '',
      adaptaciones: [],
      adaptacionesPersonalizadas: '',
      contexto: '',
      temaPersonalizado: ''
    });
    setGuiaGenerada(null);
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
    setGuiaGenerada(null);
    setCurrentStep(1);
  };

  // Ensure clase exists before generating
  const ensureClase = async () => {
    if (claseData) return claseData;

    if (!grupoData || !profesorId) {
      throw new Error('Faltan datos necesarios para crear la clase (grupo o profesor)');
    }

    // Para clases extraordinarias, id_tema puede ser null
    const temaIdToUse = temaData?.id || null;

    const nuevaClase = await createClase.mutateAsync({
      id_tema: temaIdToUse,
      id_grupo: grupoData.id,
      fecha_programada: formData.fecha || new Date().toISOString().split('T')[0],
      duracion_minutos: formData.duracion,
      contexto: formData.contexto,
    });

    setClaseData(nuevaClase);
    return nuevaClase;
  };

  // Handler: Generate desempeños for a specific competencia
  const handleGenerarDesempenoParaCompetencia = async (competenciaId: string) => {
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
      const temaNombre = formData.temaPersonalizado || temaData?.nombre || '';
      const areaName = areas.find(a => a.id === formData.areaAcademica)?.nombre || '';
      const competenciaData = competenciasCNEB.find(c => c.id === competenciaId);
      const capacidadesNames = capacidadesDeCompetencia
        .map(id => capacidadesCNEB.find(c => c.id === id)?.nombre)
        .filter(Boolean);

      const response = await supabase.functions.invoke('generate-desempenos', {
        body: {
          tema: temaNombre,
          nivel: gradoInfo?.nivel || 'Secundaria',
          grado: gradoInfo?.gradoNum || '3',
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

    if (!grupoData) {
      toast({
        title: 'Error',
        description: 'Selecciona un grupo antes de continuar',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const clase = await ensureClase();
      
      await updateClase.mutateAsync({
        id: clase.id,
        estado: 'generando_clase',
        contexto: formData.contexto,
      });

      const guia = await generateGuiaClase(
        temaNombre,
        formData.contexto,
        formData.materiales,
        {
          grado: gradoInfo?.gradoCompleto || grupoData?.grado,
          nivel: gradoInfo?.nivel,
          seccion: grupoData?.seccion,
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
          enfoqueTransversal: enfoques.find(e => e.id === formData.enfoqueTransversal)?.nombre,
          adaptaciones: formData.adaptaciones.map(id => tiposAdaptacion.find(t => t.id === id)?.nombre || ''),
          adaptacionesPersonalizadas: formData.adaptacionesPersonalizadas,
          materiales: formData.materiales
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

      await updateClase.mutateAsync({
        id: clase.id,
        estado: 'editando_guia',
        id_guia_version_actual: guiaVersion.id
      });

      toast({ title: '¡Guía generada!', description: 'La guía de clase ha sido creada con éxito' });
      setCurrentStep(2);
    } catch (error: any) {
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
      await updateClase.mutateAsync({
        id: claseData.id,
        estado: 'clase_programada'
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

  // Validación de campos obligatorios
  const getMissingFields = () => {
    const missing: string[] = [];
    
    // Tema
    if (isExtraordinaria) {
      if (!formData.temaPersonalizado.trim()) missing.push('Tema');
    } else {
      if (!temaData?.id) missing.push('Tema');
    }
    
    if (!grupoData) missing.push('Grupo');
    if (!formData.fecha) missing.push('Fecha programada');
    if (!formData.areaAcademica) missing.push('Área Académica');
    if (formData.competencias.length === 0) missing.push('Al menos una Competencia');
    
    // Check that each competencia has at least one capacidad and one desempeño
    const competenciasConCapacidades = formData.competencias.filter(
      compId => (formData.capacidadesPorCompetencia[compId] || []).length > 0
    );
    if (competenciasConCapacidades.length === 0) missing.push('Al menos una Capacidad por Competencia');
    
    const competenciasConDesempenos = formData.competencias.filter(
      compId => (formData.desempenosPorCompetencia[compId] || []).some(d => d.trim() !== '')
    );
    if (competenciasConDesempenos.length === 0) missing.push('Al menos un Desempeño por Competencia');
    if (!formData.enfoqueTransversal) missing.push('Enfoque Transversal');
    if (formData.materiales.length === 0) missing.push('Al menos un Material');
    
    return missing;
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

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Get estado label
  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      borrador: 'GUÍA PENDIENTE',
      generando_clase: 'generando clase',
      editando_guia: 'editando guía',
      guia_aprobada: 'guía aprobada',
      clase_programada: 'programada',
    };
    return labels[estado] || estado;
  };

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

        {/* Clase en Proceso */}
        {claseEnEdicion && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-primary font-medium">Clase en proceso</p>
                    <p className="font-semibold">
                      {claseEnEdicion.tema?.nombre || 'Sin tema'} • {claseEnEdicion.grupo?.grado}° {claseEnEdicion.grupo?.seccion || ''}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {getEstadoLabel(claseEnEdicion.estado)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleDescartar(claseEnEdicion.id)}
                  >
                    Descartar
                  </Button>
                  <Button 
                    variant="gradient"
                    onClick={() => handleSeleccionarSesion(claseEnEdicion)}
                  >
                    Continuar
                  </Button>
                </div>
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
        {!sesionSugerida && sesionesFiltradas.length === 0 && !claseEnEdicion && (
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
                  Define un tema personalizado fuera del plan curricular
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
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-4">
          <div className="flex justify-between">
            {STEPS.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center gap-2 ${
                  step.id === currentStep 
                    ? 'text-primary' 
                    : step.id < currentStep 
                      ? 'text-success' 
                      : 'text-muted-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.id === currentStep 
                    ? 'gradient-bg text-primary-foreground' 
                    : step.id < currentStep 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-muted'
                }`}>
                  {step.id < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <Card>
          <CardContent className="p-6">
            {/* Step 1: Context */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Read-only mode banner for completed classes */}
                {isClaseCompletada && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Lock className="w-5 h-5" />
                      <span className="font-medium">Modo solo lectura - Esta clase está completada</span>
                    </div>
                  </div>
                )}
                
                {/* SECCIÓN 1: DATOS */}
                <fieldset className="p-4 border rounded-lg space-y-4">
                  <legend className="text-lg font-semibold px-2 flex items-center gap-2">
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

                    {/* Duración */}
                    <div className="space-y-2">
                      <Label>Duración de la sesión *</Label>
                      <Select 
                        value={String(formData.duracion)} 
                        onValueChange={(value) => setFormData({...formData, duracion: parseInt(value)})}
                        disabled={isClaseCompletada}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURACIONES.map(d => (
                            <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Grupo - siempre visible */}
                    <div className="space-y-2">
                      <Label>Grupo *</Label>
                      {isExtraordinaria ? (
                        <Select 
                          value={grupoData?.id || ''} 
                          onValueChange={(value) => {
                            const grupo = grupos.find(g => g?.id === value);
                            setGrupoData(grupo);
                          }}
                          disabled={isClaseCompletada}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupos.filter(Boolean).map(g => (
                              <SelectItem key={g!.id} value={g!.id}>
                                {g!.nombre || `${g!.grado} ${g!.seccion || ''}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={grupoData?.nombre || `${grupoData?.grado} ${grupoData?.seccion || ''}`} disabled />
                      )}
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

                  {/* Info derivada del grupo */}
                  {grupoData && gradoInfo && (
                    <div className="flex gap-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <span><strong>Nivel:</strong> {gradoInfo.nivel}</span>
                      <span><strong>Grado:</strong> {gradoInfo.gradoNum}°</span>
                      <span><strong>Sección:</strong> {grupoData.seccion || 'N/A'}</span>
                    </div>
                  )}

                  {/* Área Académica */}
                  <div className="space-y-2">
                    <Label>Área Académica *</Label>
                    <Select 
                      value={formData.areaAcademica} 
                      onValueChange={(value) => setFormData({...formData, areaAcademica: value, competencias: [], capacidadesPorCompetencia: {}, desempenosPorCompetencia: {}})}
                      disabled={isClaseCompletada}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un área" />
                      </SelectTrigger>
                      <SelectContent>
                        {areas.map(area => (
                          <SelectItem key={area.id} value={area.id}>{area.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </fieldset>

                {/* SECCIÓN 2: PROPÓSITOS DE APRENDIZAJE - NUEVO DISEÑO POR COMPETENCIA */}
                <fieldset className="p-4 border rounded-lg space-y-4">
                  <legend className="text-lg font-semibold px-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Propósitos de Aprendizaje
                  </legend>
                  
                  {/* Selección de Competencias */}
                  <div className="space-y-2">
                    <Label>Competencias * (selección múltiple)</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 min-h-[60px]">
                      {formData.areaAcademica ? (
                        competenciasCNEB.map(comp => (
                          <Badge
                            key={comp.id}
                            variant={formData.competencias.includes(comp.id) ? 'default' : 'outline'}
                            className={isClaseCompletada ? "cursor-not-allowed" : "cursor-pointer"}
                            onClick={() => toggleCompetencia(comp.id)}
                          >
                            {comp.nombre}
                          </Badge>
                        ))
                      ) : (
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
                        const selectedCaps = formData.capacidadesPorCompetencia[compId] || [];
                        const desempenos = formData.desempenosPorCompetencia[compId] || [];
                        const isGenerating = generatingForCompetencia === compId;
                        
                        return (
                          <div key={compId} className="border rounded-lg p-4 bg-muted/20 space-y-4">
                            {/* Header de competencia */}
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-primary flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                {comp?.nombre}
                              </h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerarDesempenoParaCompetencia(compId)}
                                disabled={selectedCaps.length === 0 || isGenerating || isClaseCompletada}
                                className="gap-2"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generando...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4" />
                                    Generar Desempeños
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {/* Capacidades de esta competencia */}
                            <div className="space-y-2">
                              <Label className="text-sm">Capacidades *</Label>
                              <div className="flex flex-wrap gap-2 p-2 border rounded bg-background min-h-[40px]">
                                {capsForComp.length > 0 ? (
                                  capsForComp.map(cap => (
                                    <Badge
                                      key={cap.id}
                                      variant={selectedCaps.includes(cap.id) ? 'default' : 'outline'}
                                      className={isClaseCompletada ? "cursor-not-allowed text-xs" : "cursor-pointer text-xs"}
                                      onClick={() => toggleCapacidadForCompetencia(compId, cap.id)}
                                    >
                                      {cap.nombre}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No hay capacidades disponibles</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Desempeños de esta competencia */}
                            <div className="space-y-2">
                              <Label className="text-sm">Desempeños *</Label>
                              {desempenos.length > 0 ? (
                                <div className="space-y-2">
                                  {desempenos.map((desemp, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <span className="text-primary font-bold mt-2">•</span>
                                      <Textarea
                                        value={desemp}
                                        onChange={(e) => updateDesempenoForCompetencia(compId, idx, e.target.value)}
                                        placeholder="Describe el desempeño..."
                                        rows={2}
                                        disabled={isClaseCompletada}
                                        className="flex-1"
                                      />
                                      {!isClaseCompletada && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeDesempenoFromCompetencia(compId, idx)}
                                          className="text-destructive hover:text-destructive h-8 w-8 mt-1"
                                        >
                                          ×
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                                  Selecciona capacidades y usa "Generar Desempeños" o agrega manualmente
                                </p>
                              )}
                              {!isClaseCompletada && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addDesempenoForCompetencia(compId)}
                                  className="text-primary text-xs"
                                >
                                  + Agregar desempeño
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {formData.competencias.length === 0 && (
                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                      Selecciona competencias arriba para configurar capacidades y desempeños
                    </p>
                  )}

                  {/* Enfoque Transversal */}
                  <div className="space-y-2">
                    <Label>Enfoque Transversal *</Label>
                    <Select 
                      value={formData.enfoqueTransversal} 
                      onValueChange={(value) => setFormData({...formData, enfoqueTransversal: value})}
                      disabled={isClaseCompletada}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un enfoque" />
                      </SelectTrigger>
                      <SelectContent>
                        {enfoques.map(enfoque => (
                          <SelectItem key={enfoque.id} value={enfoque.id}>{enfoque.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </fieldset>

                {/* SECCIÓN 3: MATERIALES DISPONIBLES */}
                <fieldset className="p-4 border rounded-lg space-y-4">
                  <legend className="text-lg font-semibold px-2 flex items-center gap-2">
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
                  
                  <div className="space-y-2">
                    <Label>Otro material (opcional)</Label>
                    <Input 
                      placeholder="Especifica otros materiales..."
                      value={formData.materialOtro}
                      onChange={(e) => setFormData({...formData, materialOtro: e.target.value})}
                      disabled={isClaseCompletada}
                    />
                  </div>
                </fieldset>

                {/* SECCIÓN 4: ADAPTACIONES */}
                <fieldset className="p-4 border rounded-lg space-y-4">
                  <legend className="text-lg font-semibold px-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Adaptaciones (NEE)
                  </legend>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {tiposAdaptacion.map(tipo => (
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

                  <div className="space-y-2">
                    <Label>Adaptaciones personalizadas (opcional)</Label>
                    <Textarea 
                      placeholder="Describe adaptaciones específicas para estudiantes con NEE..."
                      value={formData.adaptacionesPersonalizadas}
                      onChange={(e) => setFormData({...formData, adaptacionesPersonalizadas: e.target.value})}
                      rows={2}
                      disabled={isClaseCompletada}
                    />
                  </div>
                </fieldset>

                {/* SECCIÓN 5: CONTEXTO */}
                <fieldset className="p-4 border rounded-lg space-y-4">
                  <legend className="text-lg font-semibold px-2 flex items-center gap-2">
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
                  <div className="space-y-6 animate-fade-in">
                    {/* Success Banner */}
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2 text-success">
                        <BookOpen className="w-5 h-5" />
                        <span className="font-medium">{claseData?.id_guia_version_actual ? 'Guía de clase cargada' : 'Guía generada exitosamente'}</span>
                      </div>
                    </div>

                    {/* I. DATOS GENERALES - Rediseño MINEDU */}
                    <div className="border-2 border-amber-600 rounded-lg overflow-hidden">
                      <div className="bg-amber-600 text-white px-4 py-2 font-bold">
                        I. DATOS GENERALES
                      </div>
                      <div className="p-4 bg-amber-50/30">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">TÍTULO DE LA SESIÓN</span>
                            <p className="font-semibold text-lg">{guiaGenerada.datos_generales.titulo_sesion}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">ÁREA</span>
                            <p className="font-medium">{guiaGenerada.datos_generales.area_academica}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">GRADO Y SECCIÓN</span>
                            <p className="font-medium">{guiaGenerada.datos_generales.nivel} - {guiaGenerada.datos_generales.grado}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-muted-foreground">DURACIÓN</span>
                            <p className="font-medium">{guiaGenerada.datos_generales.duracion || `${formData.duracion} minutos`}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* II. PROPÓSITOS DE APRENDIZAJE - Nueva tabla estilizada */}
                    <div className="border-2 border-teal-600 rounded-lg overflow-hidden">
                      <div className="bg-teal-600 text-white px-4 py-2 font-bold">
                        II. PROPÓSITOS DE APRENDIZAJE
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-teal-100 text-teal-800">
                              <th className="text-left p-3 font-semibold border-r border-teal-200">COMPETENCIA / CAPACIDADES</th>
                              <th className="text-left p-3 font-semibold border-r border-teal-200">CRITERIOS DE EVALUACIÓN (DESEMPEÑOS)</th>
                              <th className="text-left p-3 font-semibold border-r border-teal-200">EVIDENCIA DE APRENDIZAJE</th>
                              <th className="text-left p-3 font-semibold">INSTRUMENTO DE VALORACIÓN</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guiaGenerada.propositos_aprendizaje.map((prop, i) => (
                              <tr key={i} className="border-t border-teal-200 hover:bg-teal-50/50">
                                <td className="p-3 border-r border-teal-200 align-top">
                                  <p className="font-medium text-teal-700">{prop.competencia}</p>
                                </td>
                                <td className="p-3 border-r border-teal-200 align-top">
                                  {Array.isArray(prop.criterios_evaluacion) ? (
                                    <ul className="space-y-2">
                                      {prop.criterios_evaluacion.map((criterio, j) => (
                                        <li key={j} className="flex gap-2">
                                          <span className="text-teal-600 font-bold">•</span>
                                          <span>{criterio}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p>{prop.criterios_evaluacion}</p>
                                  )}
                                </td>
                                <td className="p-3 border-r border-teal-200 align-top">{prop.evidencia_aprendizaje}</td>
                                <td className="p-3 align-top">
                                  <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
                                    {prop.instrumento_valoracion}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* ENFOQUES TRANSVERSALES - Tabla separada */}
                    <div className="border-2 border-emerald-600 rounded-lg overflow-hidden">
                      <div className="bg-emerald-600 text-white px-4 py-2 font-bold">
                        ENFOQUES TRANSVERSALES
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-emerald-100 text-emerald-800">
                              <th className="text-left p-3 font-semibold border-r border-emerald-200 w-1/3">ENFOQUES TRANSVERSALES</th>
                              <th className="text-left p-3 font-semibold">ACCIONES OBSERVABLES</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guiaGenerada.enfoques_transversales.map((enfoque, i) => (
                              <tr key={i} className="border-t border-emerald-200 hover:bg-emerald-50/50">
                                <td className="p-3 border-r border-emerald-200 font-medium text-emerald-700">{enfoque.nombre}</td>
                                <td className="p-3">{enfoque.descripcion}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* III. PREPARACIÓN DE LA SESIÓN - Layout 2 columnas */}
                    <div className="border-2 border-sky-600 rounded-lg overflow-hidden">
                      <div className="bg-sky-600 text-white px-4 py-2 font-bold">
                        III. PREPARACIÓN DE LA SESIÓN
                      </div>
                      <div className="grid md:grid-cols-2 divide-x divide-sky-200">
                        <div className="p-4">
                          <h4 className="font-semibold text-sky-700 mb-3">¿Qué necesitamos hacer antes de la sesión?</h4>
                          <p className="text-sm leading-relaxed">{guiaGenerada.preparacion.antes_sesion}</p>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-sky-700 mb-3">¿Qué recursos o materiales se utilizarán?</h4>
                          <ul className="space-y-2">
                            {guiaGenerada.preparacion.materiales.map((mat, i) => (
                              <li key={i} className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                                {mat}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* IV. MOMENTOS DE LA SESIÓN - Cards con colores y tiempo */}
                    <div className="border-2 border-purple-600 rounded-lg overflow-hidden">
                      <div className="bg-purple-600 text-white px-4 py-2 font-bold">
                        IV. MOMENTOS DE LA SESIÓN
                      </div>
                      <div className="p-4 space-y-4">
                        {guiaGenerada.momentos_sesion.map((fase, i) => {
                          const faseStyles: Record<string, { border: string; bg: string; title: string; badge: string }> = {
                            INICIO: { 
                              border: 'border-l-amber-500', 
                              bg: 'bg-amber-50', 
                              title: 'text-amber-700',
                              badge: 'bg-amber-100 text-amber-700 border-amber-300'
                            },
                            DESARROLLO: { 
                              border: 'border-l-blue-500', 
                              bg: 'bg-blue-50', 
                              title: 'text-blue-700',
                              badge: 'bg-blue-100 text-blue-700 border-blue-300'
                            },
                            CIERRE: { 
                              border: 'border-l-green-500', 
                              bg: 'bg-green-50', 
                              title: 'text-green-700',
                              badge: 'bg-green-100 text-green-700 border-green-300'
                            }
                          };
                          const style = faseStyles[fase.fase] || faseStyles.INICIO;
                          return (
                            <div 
                              key={i} 
                              className={`p-4 rounded-lg border-l-4 ${style.border} ${style.bg}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className={`font-bold text-lg ${style.title}`}>
                                  {fase.fase}
                                </span>
                                <Badge variant="outline" className={`flex items-center gap-1 ${style.badge}`}>
                                  <Clock className="w-3 h-3" />
                                  {fase.duracion}
                                </Badge>
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{fase.actividades}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Adaptaciones Sugeridas */}
                    {guiaGenerada.adaptaciones_sugeridas && (
                      <div className="border-2 border-rose-400 rounded-lg overflow-hidden">
                        <div className="bg-rose-500 text-white px-4 py-2 font-bold flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          ADAPTACIONES SUGERIDAS (NEE)
                        </div>
                        <div className="p-4 bg-rose-50/30">
                          <p className="text-sm leading-relaxed">{guiaGenerada.adaptaciones_sugeridas.estrategias_diferenciadas}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Validar */}
            {currentStep === 3 && !isClaseCompletada && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <FileCheck className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Validar y Finalizar</h2>
                  <p className="text-muted-foreground mb-6">
                    Revisa que la guía esté completa
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Contexto de la clase', completed: true },
                    { label: 'Guía de clase generada', completed: !!guiaGenerada }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-4 rounded-lg ${item.completed ? 'bg-success/10' : 'bg-muted'}`}>
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={item.completed ? 'text-success font-medium' : 'text-muted-foreground'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {guiaGenerada && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-medium text-primary">¡Todo listo!</p>
                    <p className="text-sm text-muted-foreground">Tu clase está preparada para ser impartida</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Show completion message if class is completed and on step 3 */}
            {currentStep === 3 && isClaseCompletada && (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <h2 className="text-lg font-semibold mb-2">Clase Completada</h2>
                  <p className="text-muted-foreground mb-6">
                    Esta clase ya ha sido completada y validada
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Contexto de la clase', completed: true },
                    { label: 'Guía de clase generada', completed: !!guiaGenerada }
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-4 rounded-lg ${item.completed ? 'bg-success/10' : 'bg-muted'}`}>
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                      )}
                      <span className={item.completed ? 'text-success font-medium' : 'text-muted-foreground'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {guiaGenerada && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                    <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="font-medium text-success">Clase completada exitosamente</p>
                    <p className="text-sm text-muted-foreground">Todos los componentes están completos</p>
                  </div>
                )}
              </div>
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

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
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
                  onClick={() => setCurrentStep(2)}
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
