import { useRef, useCallback, useState } from 'react';
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
  Compass,
  ChevronDown,
  FileType,
  HelpCircle,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const handleExportWord = useCallback(() => {
    if (!contentRef.current) return;
    
    try {
      const html = contentRef.current.innerHTML;
      const filename = `guia-${guia.datos_generales.titulo_sesion.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.doc`;
      
      const blob = new Blob([`
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word'
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>Guía de Clase</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12pt; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
          </style>
        </head>
        <body>${html}</body>
        </html>
      `], { type: 'application/msword' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting Word:', error);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4" />
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportWord} className="gap-2 cursor-pointer">
                <FileType className="w-4 h-4" />
                Exportar como Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit mode indicator */}
      {canEdit && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
          <Sparkles className="w-4 h-4" />
          <span>Modo edición activo: Haz clic en los campos con borde punteado para editarlos</span>
        </div>
      )}

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
        <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-teal-400">
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
                              <span className="text-teal-600 font-bold shrink-0">•</span>
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
        <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-indigo-400">
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
        <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-sky-400">
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
                    <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 shrink-0"></span>
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

        {/* Adaptaciones y Diferenciación Pedagógica */}
        {guia.adaptaciones_sugeridas && (guia.adaptaciones_sugeridas.estrategias_diferenciadas || guia.adaptaciones_sugeridas.apoyo_adicional) && (
          <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-rose-400">
            <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">ADAPTACIONES Y DIFERENCIACIÓN PEDAGÓGICA</span>
            </header>
            <div className="p-5 space-y-5">
              {/* Main strategies (legacy field) */}
              {guia.adaptaciones_sugeridas.estrategias_diferenciadas && (
                <div className="text-sm leading-relaxed">
                  <EditableText
                    value={guia.adaptaciones_sugeridas.estrategias_diferenciadas}
                    onChange={canEdit ? (v) => updateGuia(['adaptaciones_sugeridas', 'estrategias_diferenciadas'], v) : undefined}
                    disabled={!canEdit}
                    multiline
                  />
                </div>
              )}

              {/* New structured adaptations */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Para estudiantes que necesitan más apoyo */}
                {guia.adaptaciones_sugeridas.apoyo_adicional && guia.adaptaciones_sugeridas.apoyo_adicional.length > 0 && (
                  <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-lg p-4 border border-rose-200 dark:border-rose-800">
                    <div className="flex items-center gap-2 mb-3">
                      <HeartHandshake className="w-4 h-4 text-rose-600" />
                      <h4 className="font-semibold text-sm text-rose-700 dark:text-rose-400">
                        Apoyo Adicional
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {guia.adaptaciones_sugeridas.apoyo_adicional.map((item, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-rose-500 shrink-0">•</span>
                          <EditableText
                            value={item}
                            onChange={canEdit ? (v) => {
                              const newItems = [...(guia.adaptaciones_sugeridas?.apoyo_adicional || [])];
                              newItems[i] = v;
                              updateGuia(['adaptaciones_sugeridas', 'apoyo_adicional'], newItems);
                            } : undefined}
                            disabled={!canEdit}
                            multiline
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Para estudiantes avanzados */}
                {guia.adaptaciones_sugeridas.extension_avanzados && guia.adaptaciones_sugeridas.extension_avanzados.length > 0 && (
                  <div className="bg-violet-50/50 dark:bg-violet-950/20 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <h4 className="font-semibold text-sm text-violet-700 dark:text-violet-400">
                        Extensión Avanzados
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {guia.adaptaciones_sugeridas.extension_avanzados.map((item, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-violet-500 shrink-0">•</span>
                          <EditableText
                            value={item}
                            onChange={canEdit ? (v) => {
                              const newItems = [...(guia.adaptaciones_sugeridas?.extension_avanzados || [])];
                              newItems[i] = v;
                              updateGuia(['adaptaciones_sugeridas', 'extension_avanzados'], newItems);
                            } : undefined}
                            disabled={!canEdit}
                            multiline
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recursos de apoyo */}
                {guia.adaptaciones_sugeridas.recursos_apoyo && guia.adaptaciones_sugeridas.recursos_apoyo.length > 0 && (
                  <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 mb-3">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                        Recursos de Apoyo
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {guia.adaptaciones_sugeridas.recursos_apoyo.map((item, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-amber-500 shrink-0">•</span>
                          <EditableText
                            value={item}
                            onChange={canEdit ? (v) => {
                              const newItems = [...(guia.adaptaciones_sugeridas?.recursos_apoyo || [])];
                              newItems[i] = v;
                              updateGuia(['adaptaciones_sugeridas', 'recursos_apoyo'], newItems);
                            } : undefined}
                            disabled={!canEdit}
                            multiline
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
