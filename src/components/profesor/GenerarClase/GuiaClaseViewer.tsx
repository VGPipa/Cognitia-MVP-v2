import { useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Clock, 
  Lightbulb, 
  Download, 
  FileText,
  Target,
  Users,
  GraduationCap,
  Compass
} from 'lucide-react';
import type { GuiaClaseData } from '@/lib/ai/generate';
import { EditableText } from './EditableText';

interface GuiaClaseViewerProps {
  guia: GuiaClaseData;
  duracion?: number;
  isLoaded?: boolean;
  onGuiaChange?: (guia: GuiaClaseData) => void;
  readOnly?: boolean;
}

export function GuiaClaseViewer({ 
  guia, 
  duracion, 
  isLoaded = false,
  onGuiaChange,
  readOnly = false 
}: GuiaClaseViewerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = contentRef.current;
      const filename = `guia-${guia.datos_generales.titulo_sesion.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`;
      
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          }
        })
        .from(element)
        .save();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  }, [guia.datos_generales.titulo_sesion]);

  // Helper to update nested guia data
  const updateGuia = useCallback((path: (string | number)[], value: any) => {
    if (!onGuiaChange || readOnly) return;
    
    const newGuia = JSON.parse(JSON.stringify(guia));
    let current: any = newGuia;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    
    onGuiaChange(newGuia);
  }, [guia, onGuiaChange, readOnly]);

  const canEdit = !!onGuiaChange && !readOnly;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-success">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium text-sm">
            {isLoaded ? 'Guía de clase cargada' : 'Guía generada exitosamente'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Main Content for PDF Export */}
      <div ref={contentRef} className="space-y-6 bg-background print:bg-white">
        {/* I. DATOS GENERALES */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">I. DATOS GENERALES</span>
          </header>
          <div className="p-5 bg-card">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Título de la Sesión
                </span>
                <p className="font-semibold text-lg mt-1 leading-relaxed">
                  <EditableText
                    value={guia.datos_generales.titulo_sesion}
                    onChange={canEdit ? (v) => updateGuia(['datos_generales', 'titulo_sesion'], v) : undefined}
                    disabled={!canEdit}
                  />
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Área
                </span>
                <p className="font-medium mt-1">{guia.datos_generales.area_academica}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Grado y Sección
                </span>
                <p className="font-medium mt-1">{guia.datos_generales.nivel} - {guia.datos_generales.grado}</p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Duración
                </span>
                <p className="font-medium mt-1">{guia.datos_generales.duracion || `${duracion} minutos`}</p>
              </div>
            </div>
          </div>
        </section>

        {/* II. PROPÓSITOS DE APRENDIZAJE */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">II. PROPÓSITOS DE APRENDIZAJE</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50">
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border">
                    Competencia / Capacidades
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border">
                    Criterios de Evaluación
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border">
                    Evidencia
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Instrumento
                  </th>
                </tr>
              </thead>
              <tbody>
                {guia.propositos_aprendizaje.map((prop, i) => (
                  <tr key={i} className="border-t border-border hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 border-r border-border align-top">
                      <p className="font-medium text-foreground">{prop.competencia}</p>
                    </td>
                    <td className="p-3 border-r border-border align-top">
                      {Array.isArray(prop.criterios_evaluacion) ? (
                        <ul className="space-y-2">
                          {prop.criterios_evaluacion.map((criterio, j) => (
                            <li key={j} className="flex gap-2">
                              <span className="text-primary font-bold shrink-0">•</span>
                              <EditableText
                                value={criterio}
                                onChange={canEdit ? (v) => {
                                  const newCriterios = [...prop.criterios_evaluacion];
                                  newCriterios[j] = v;
                                  updateGuia(['propositos_aprendizaje', i, 'criterios_evaluacion'], newCriterios);
                                } : undefined}
                                disabled={!canEdit}
                                multiline
                              />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>{prop.criterios_evaluacion}</p>
                      )}
                    </td>
                    <td className="p-3 border-r border-border align-top">
                      <EditableText
                        value={prop.evidencia_aprendizaje}
                        onChange={canEdit ? (v) => updateGuia(['propositos_aprendizaje', i, 'evidencia_aprendizaje'], v) : undefined}
                        disabled={!canEdit}
                        multiline
                      />
                    </td>
                    <td className="p-3 align-top">
                      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                        {prop.instrumento_valoracion}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ENFOQUES TRANSVERSALES */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
            <Compass className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">ENFOQUES TRANSVERSALES</span>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50">
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border w-1/3">
                    Enfoque
                  </th>
                  <th className="text-left p-3 font-semibold text-slate-700 dark:text-slate-300">
                    Acciones Observables
                  </th>
                </tr>
              </thead>
              <tbody>
                {guia.enfoques_transversales.map((enfoque, i) => (
                  <tr key={i} className="border-t border-border hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 border-r border-border font-medium">{enfoque.nombre}</td>
                    <td className="p-3">
                      <EditableText
                        value={enfoque.descripcion}
                        onChange={canEdit ? (v) => updateGuia(['enfoques_transversales', i, 'descripcion'], v) : undefined}
                        disabled={!canEdit}
                        multiline
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* III. PREPARACIÓN DE LA SESIÓN */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">III. PREPARACIÓN DE LA SESIÓN</span>
          </header>
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-5">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">
                ¿Qué necesitamos hacer antes de la sesión?
              </h4>
              <div className="text-sm leading-relaxed">
                <EditableText
                  value={guia.preparacion.antes_sesion}
                  onChange={canEdit ? (v) => updateGuia(['preparacion', 'antes_sesion'], v) : undefined}
                  disabled={!canEdit}
                  multiline
                />
              </div>
            </div>
            <div className="p-5">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">
                ¿Qué recursos o materiales se utilizarán?
              </h4>
              <ul className="space-y-2">
                {guia.preparacion.materiales.map((mat, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></span>
                    <EditableText
                      value={mat}
                      onChange={canEdit ? (v) => {
                        const newMateriales = [...guia.preparacion.materiales];
                        newMateriales[i] = v;
                        updateGuia(['preparacion', 'materiales'], newMateriales);
                      } : undefined}
                      disabled={!canEdit}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* IV. MOMENTOS DE LA SESIÓN */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-semibold text-sm tracking-wide">IV. MOMENTOS DE LA SESIÓN</span>
          </header>
          <div className="p-5 space-y-4">
            {guia.momentos_sesion.map((fase, i) => {
              const phaseConfig = {
                INICIO: { 
                  border: 'border-l-amber-500', 
                  bg: 'bg-amber-50/50 dark:bg-amber-950/20',
                  icon: '🎯',
                  title: 'text-amber-700 dark:text-amber-400'
                },
                DESARROLLO: { 
                  border: 'border-l-blue-500', 
                  bg: 'bg-blue-50/50 dark:bg-blue-950/20',
                  icon: '📚',
                  title: 'text-blue-700 dark:text-blue-400'
                },
                CIERRE: { 
                  border: 'border-l-green-500', 
                  bg: 'bg-green-50/50 dark:bg-green-950/20',
                  icon: '✅',
                  title: 'text-green-700 dark:text-green-400'
                }
              };
              const config = phaseConfig[fase.fase] || phaseConfig.INICIO;
              
              // Check if we have the new detailed structure
              const hasDetailedStructure = 'objetivo_fase' in fase || 'actividades_docente' in fase;
              
              return (
                <div 
                  key={i} 
                  className={`rounded-lg border-l-4 ${config.border} ${config.bg} overflow-hidden`}
                >
                  {/* Phase Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <span className={`font-bold text-base ${config.title} flex items-center gap-2`}>
                      <span>{config.icon}</span>
                      {fase.fase}
                    </span>
                    <Badge variant="outline" className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80">
                      <Clock className="w-3 h-3" />
                      {fase.duracion}
                    </Badge>
                  </div>
                  
                  {/* Phase Content */}
                  <div className="p-4 space-y-4">
                    {hasDetailedStructure ? (
                      <>
                        {/* Objetivo de la fase */}
                        {'objetivo_fase' in fase && (fase as any).objetivo_fase && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              <Target className="w-3.5 h-3.5" />
                              Objetivo de la fase
                            </div>
                            <div className="text-sm leading-relaxed pl-5">
                              <EditableText
                                value={(fase as any).objetivo_fase}
                                onChange={canEdit ? (v) => updateGuia(['momentos_sesion', i, 'objetivo_fase'], v) : undefined}
                                disabled={!canEdit}
                                multiline
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Actividades del Docente */}
                        {'actividades_docente' in fase && Array.isArray((fase as any).actividades_docente) && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              <GraduationCap className="w-3.5 h-3.5" />
                              Actividades del Docente
                            </div>
                            <ul className="space-y-1.5 pl-5">
                              {((fase as any).actividades_docente as string[]).map((act, j) => (
                                <li key={j} className="text-sm flex gap-2">
                                  <span className="text-primary font-bold shrink-0">•</span>
                                  <EditableText
                                    value={act}
                                    onChange={canEdit ? (v) => {
                                      const newActs = [...(fase as any).actividades_docente];
                                      newActs[j] = v;
                                      updateGuia(['momentos_sesion', i, 'actividades_docente'], newActs);
                                    } : undefined}
                                    disabled={!canEdit}
                                    multiline
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Actividades del Estudiante */}
                        {'actividades_estudiante' in fase && Array.isArray((fase as any).actividades_estudiante) && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              <Users className="w-3.5 h-3.5" />
                              Actividades del Estudiante
                            </div>
                            <ul className="space-y-1.5 pl-5">
                              {((fase as any).actividades_estudiante as string[]).map((act, j) => (
                                <li key={j} className="text-sm flex gap-2">
                                  <span className="text-accent font-bold shrink-0">•</span>
                                  <EditableText
                                    value={act}
                                    onChange={canEdit ? (v) => {
                                      const newActs = [...(fase as any).actividades_estudiante];
                                      newActs[j] = v;
                                      updateGuia(['momentos_sesion', i, 'actividades_estudiante'], newActs);
                                    } : undefined}
                                    disabled={!canEdit}
                                    multiline
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Fallback: Legacy simple structure */
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        <EditableText
                          value={fase.actividades}
                          onChange={canEdit ? (v) => updateGuia(['momentos_sesion', i, 'actividades'], v) : undefined}
                          disabled={!canEdit}
                          multiline
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Adaptaciones Sugeridas */}
        {guia.adaptaciones_sugeridas && guia.adaptaciones_sugeridas.estrategias_diferenciadas && (
          <section className="border border-border rounded-lg overflow-hidden">
            <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">ADAPTACIONES SUGERIDAS (NEE)</span>
            </header>
            <div className="p-5">
              <div className="text-sm leading-relaxed">
                <EditableText
                  value={guia.adaptaciones_sugeridas.estrategias_diferenciadas}
                  onChange={canEdit ? (v) => updateGuia(['adaptaciones_sugeridas', 'estrategias_diferenciadas'], v) : undefined}
                  disabled={!canEdit}
                  multiline
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
