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
  HeartHandshake,
  Pencil,
  Sparkles,
  MessageSquareQuote,
  Zap,
  Brain,
  Layers
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';
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
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});

  const toggleSectionEdit = (section: string) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExportPDF = useCallback(async () => {
    if (!contentRef.current) return;
    
    try {
      // Guardar estado actual de edición
      const previousEditingSections = { ...editingSections };
      
      // Desactivar todos los modos de edición
      setEditingSections({});
      
      // Añadir clase para ocultar elementos de UI
      contentRef.current.classList.add('pdf-export-mode');
      
      // Esperar a que React actualice el DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
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
      
      // Restaurar estado y remover clase
      contentRef.current.classList.remove('pdf-export-mode');
      setEditingSections(previousEditingSections);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      contentRef.current?.classList.remove('pdf-export-mode');
    }
  }, [guia.datos_generales.titulo_sesion, editingSections]);

  const handleExportWord = useCallback(async () => {
    try {
      const filename = `guia-${guia.datos_generales.titulo_sesion.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.docx`;
      
      const tableBorders = {
        top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      };

      // Build document sections
      const children: (Paragraph | Table)[] = [];

      // Title
      children.push(
        new Paragraph({
          text: guia.datos_generales.titulo_sesion,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      // I. DATOS GENERALES
      children.push(
        new Paragraph({
          text: "I. DATOS GENERALES",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Área", bold: true })] })], borders: tableBorders }),
                new TableCell({ children: [new Paragraph(guia.datos_generales.area_academica)], borders: tableBorders }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Grado", bold: true })] })], borders: tableBorders }),
                new TableCell({ children: [new Paragraph(`${guia.datos_generales.nivel} - ${guia.datos_generales.grado}`)], borders: tableBorders }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duración", bold: true })] })], borders: tableBorders }),
                new TableCell({ children: [new Paragraph(guia.datos_generales.duracion || `${duracion} minutos`)], borders: tableBorders }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Título", bold: true })] })], borders: tableBorders }),
                new TableCell({ children: [new Paragraph(guia.datos_generales.titulo_sesion)], borders: tableBorders }),
              ],
            }),
          ],
        })
      );

      // II. PROPÓSITOS DE APRENDIZAJE
      children.push(
        new Paragraph({
          text: "II. PROPÓSITOS DE APRENDIZAJE",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      guia.propositos_aprendizaje.forEach((prop) => {
        // Competencia header
        children.push(
          new Paragraph({
            children: [new TextRun({ text: prop.competencia, bold: true })],
            shading: { fill: "E0F2FE" },
            spacing: { before: 200, after: 100 },
          })
        );

        const capacidadesText = prop.capacidades?.join('\n• ') || '';
        const desempenosText = prop.criterios_evaluacion?.join('\n• ') || '';

        children.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Capacidades", bold: true })] })], 
                    borders: tableBorders,
                    shading: { fill: "F1F5F9" },
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Desempeños", bold: true })] })], 
                    borders: tableBorders,
                    shading: { fill: "F1F5F9" },
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph(capacidadesText ? `• ${capacidadesText}` : '-')], 
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [new Paragraph(desempenosText ? `• ${desempenosText}` : '-')], 
                    borders: tableBorders,
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Evidencia de Aprendizaje: ", bold: true }), new TextRun(prop.evidencia_aprendizaje)] }),
                    ], 
                    borders: tableBorders,
                  }),
                  new TableCell({ 
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "Instrumento de valoración: ", bold: true }), new TextRun(prop.instrumento_valoracion)] }),
                    ], 
                    borders: tableBorders,
                  }),
                ],
              }),
            ],
          })
        );
      });

      // ENFOQUES TRANSVERSALES
      children.push(
        new Paragraph({
          text: "ENFOQUES TRANSVERSALES",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: "Enfoque", bold: true })] })], 
                  borders: tableBorders,
                  shading: { fill: "F1F5F9" },
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: "Acciones Observables", bold: true })] })], 
                  borders: tableBorders,
                  shading: { fill: "F1F5F9" },
                }),
              ],
            }),
            ...guia.enfoques_transversales.map((enfoque) => 
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(enfoque.nombre)], borders: tableBorders }),
                  new TableCell({ children: [new Paragraph(enfoque.descripcion)], borders: tableBorders }),
                ],
              })
            ),
          ],
        })
      );

      // III. PREPARACIÓN DE LA SESIÓN
      children.push(
        new Paragraph({
          text: "III. PREPARACIÓN DE LA SESIÓN",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: "¿Qué necesitamos hacer antes de la sesión?", bold: true })] })], 
                  borders: tableBorders,
                  shading: { fill: "F1F5F9" },
                }),
                new TableCell({ 
                  children: [new Paragraph({ children: [new TextRun({ text: "¿Qué recursos o materiales se utilizarán?", bold: true })] })], 
                  borders: tableBorders,
                  shading: { fill: "F1F5F9" },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(guia.preparacion.antes_sesion)], borders: tableBorders }),
                new TableCell({ 
                  children: [new Paragraph(`• ${guia.preparacion.materiales.join('\n• ')}`)], 
                  borders: tableBorders,
                }),
              ],
            }),
          ],
        })
      );

      // IV. MOMENTOS DE LA SESIÓN
      children.push(
        new Paragraph({
          text: "IV. MOMENTOS DE LA SESIÓN",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );

      guia.momentos_sesion.forEach((fase) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${fase.fase} `, bold: true }),
              new TextRun({ text: `(${fase.duracion})`, italics: true }),
            ],
            spacing: { before: 200, after: 100 },
            shading: { 
              fill: fase.fase === 'INICIO' ? 'FEF3C7' : fase.fase === 'DESARROLLO' ? 'DBEAFE' : 'D1FAE5' 
            },
          })
        );

        const hasDetailedStructure = 'objetivo_fase' in fase || 'actividades_docente' in fase;
        
        if (hasDetailedStructure) {
          if ((fase as any).objetivo_fase) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: "Objetivo: ", bold: true }),
                  new TextRun((fase as any).objetivo_fase),
                ],
                spacing: { after: 100 },
              })
            );
          }
          
          if ((fase as any).actividades_docente?.length > 0) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: "Actividades del Docente:", bold: true })],
                spacing: { before: 100 },
              })
            );
            children.push(
              new Paragraph({
                text: `• ${((fase as any).actividades_docente as string[]).join('\n• ')}`,
                spacing: { after: 100 },
              })
            );
          }
          
          if ((fase as any).actividades_estudiante?.length > 0) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: "Actividades del Estudiante:", bold: true })],
                spacing: { before: 100 },
              })
            );
            children.push(
              new Paragraph({
                text: `• ${((fase as any).actividades_estudiante as string[]).join('\n• ')}`,
                spacing: { after: 100 },
              })
            );
          }
        } else {
          children.push(
            new Paragraph({
              text: fase.actividades,
              spacing: { after: 100 },
            })
          );
        }
      });

      // Adaptaciones
      if (guia.adaptaciones_sugeridas?.estrategias_diferenciadas) {
        children.push(
          new Paragraph({
            text: "V. ADAPTACIONES Y DIFERENCIACIÓN PEDAGÓGICA",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          })
        );

        children.push(
          new Paragraph({
            text: guia.adaptaciones_sugeridas.estrategias_diferenciadas,
            spacing: { after: 100 },
          })
        );
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, filename);
    } catch (error) {
      console.error('Error exporting Word:', error);
    }
  }, [guia, duracion]);

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

      {/* Main Content for PDF Export */}
      <div ref={contentRef} className="space-y-6 bg-background print:bg-white">
        {/* I. DATOS GENERALES */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">I. DATOS GENERALES</span>
            </div>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSectionEdit('datos_generales')}
                className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['datos_generales'] ? 'bg-white/20' : ''}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
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
                    sectionEditing={editingSections['datos_generales']}
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

        {/* II. PROPÓSITOS DE APRENDIZAJE - New MINEDU structure */}
        <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-teal-400">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">II. PROPÓSITOS DE APRENDIZAJE</span>
            </div>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSectionEdit('propositos')}
                className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['propositos'] ? 'bg-white/20' : ''}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
          </header>
          <div className="divide-y divide-border">
            {guia.propositos_aprendizaje.map((prop, i) => (
              <div key={i} className="bg-card">
                {/* Table Header */}
                {/* Table Header - 4 columns */}
                <div className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800/50 text-sm">
                  <div className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border">
                    COMP. / CAPACIDADES
                  </div>
                  <div className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border">
                    DESEMPEÑOS
                  </div>
                  <div className="p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-border">
                    EVIDENCIA
                  </div>
                  <div className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                    INSTRUMENTO
                  </div>
                </div>
                
                {/* Competencia as transversal bar */}
                <div className="p-3 bg-sky-100 dark:bg-sky-950/30 font-medium text-sm border-t border-border">
                  {prop.competencia}
                </div>
                
                {/* 4 columns: Capacidades, Desempeños, Evidencia, Instrumento */}
                <div className="grid grid-cols-4 border-t border-border">
                  <div className="p-3 border-r border-border">
                    <ul className="space-y-2">
                      {prop.capacidades && prop.capacidades.length > 0 ? (
                        prop.capacidades.map((cap, j) => (
                          <li key={j} className="flex gap-2 text-sm">
                            <span className="text-teal-600 font-bold shrink-0">•</span>
                            <span className="font-medium">{cap}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-muted-foreground italic">Sin capacidades</li>
                      )}
                    </ul>
                  </div>
                  <div className="p-3 border-r border-border">
                    <ul className="space-y-2">
                      {Array.isArray(prop.criterios_evaluacion) ? (
                        prop.criterios_evaluacion.map((criterio, j) => (
                          <li key={j} className="flex gap-2 text-sm">
                            <span className="text-teal-600 font-bold shrink-0">•</span>
                            <EditableText
                              value={criterio}
                              onChange={canEdit ? (v) => {
                                const newCriterios = [...prop.criterios_evaluacion];
                                newCriterios[j] = v;
                                updateGuia(['propositos_aprendizaje', i, 'criterios_evaluacion'], newCriterios);
                              } : undefined}
                              disabled={!canEdit}
                              sectionEditing={editingSections['propositos']}
                              multiline
                            />
                          </li>
                        ))
                      ) : (
                        <li className="text-sm">{prop.criterios_evaluacion}</li>
                      )}
                    </ul>
                  </div>
                  <div className="p-3 border-r border-border">
                    <div className="text-sm">
                      <EditableText
                        value={prop.evidencia_aprendizaje}
                        onChange={canEdit ? (v) => updateGuia(['propositos_aprendizaje', i, 'evidencia_aprendizaje'], v) : undefined}
                        disabled={!canEdit}
                        sectionEditing={editingSections['propositos']}
                        multiline
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800">
                      {prop.instrumento_valoracion}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ENFOQUES TRANSVERSALES */}
        <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-indigo-400">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">ENFOQUES TRANSVERSALES</span>
            </div>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSectionEdit('enfoques')}
                className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['enfoques'] ? 'bg-white/20' : ''}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
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
                        sectionEditing={editingSections['enfoques']}
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
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">III. PREPARACIÓN DE LA SESIÓN</span>
            </div>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSectionEdit('preparacion')}
                className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['preparacion'] ? 'bg-white/20' : ''}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
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
                  sectionEditing={editingSections['preparacion']}
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
                      sectionEditing={editingSections['preparacion']}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* IV. SITUACIÓN SIGNIFICATIVA - NEW CognitIA Section */}
        {guia.situacion_significativa && (
          <section className="border border-border rounded-lg overflow-hidden border-l-4 border-l-amber-500">
            <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="font-semibold text-sm tracking-wide">IV. SITUACIÓN SIGNIFICATIVA</span>
              </div>
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleSectionEdit('situacion')}
                  className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['situacion'] ? 'bg-white/20' : ''}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
            </header>
            <div className="p-5 space-y-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10">
              {/* Contexto */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Contexto
                </h4>
                <div className="text-sm leading-relaxed bg-white/80 dark:bg-slate-900/50 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <EditableText
                    value={guia.situacion_significativa.contexto}
                    onChange={canEdit ? (v) => updateGuia(['situacion_significativa', 'contexto'], v) : undefined}
                    disabled={!canEdit}
                    sectionEditing={editingSections['situacion']}
                    multiline
                  />
                </div>
              </div>

              {/* Reto/Desafío */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Reto / Desafío
                </h4>
                <div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg p-4 border-2 border-amber-300 dark:border-amber-700 text-center">
                  <p className="font-semibold text-amber-900 dark:text-amber-100 text-lg">
                    <EditableText
                      value={guia.situacion_significativa.reto}
                      onChange={canEdit ? (v) => updateGuia(['situacion_significativa', 'reto'], v) : undefined}
                      disabled={!canEdit}
                      sectionEditing={editingSections['situacion']}
                      multiline
                    />
                  </p>
                </div>
              </div>

              {/* Producto */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Producto
                </h4>
                <div className="text-sm leading-relaxed bg-white/80 dark:bg-slate-900/50 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <EditableText
                    value={guia.situacion_significativa.producto}
                    onChange={canEdit ? (v) => updateGuia(['situacion_significativa', 'producto'], v) : undefined}
                    disabled={!canEdit}
                    sectionEditing={editingSections['situacion']}
                    multiline
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* V. MOMENTOS DE LA SESIÓN */}
        <section className="border border-border rounded-lg overflow-hidden">
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-semibold text-sm tracking-wide">V. MOMENTOS DE LA SESIÓN</span>
            </div>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleSectionEdit('momentos')}
                className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['momentos'] ? 'bg-white/20' : ''}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
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
                                sectionEditing={editingSections['momentos']}
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
                                    sectionEditing={editingSections['momentos']}
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
                                    sectionEditing={editingSections['momentos']}
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
                          sectionEditing={editingSections['momentos']}
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
          <header className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span className="font-semibold text-sm tracking-wide">VI. ADAPTACIONES Y DIFERENCIACIÓN PEDAGÓGICA</span>
              </div>
              {canEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleSectionEdit('adaptaciones')}
                  className={`text-white hover:bg-white/20 h-7 w-7 p-0 ${editingSections['adaptaciones'] ? 'bg-white/20' : ''}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
            </header>
            <div className="p-5 space-y-5">
              {/* Main strategies (legacy field) */}
              {guia.adaptaciones_sugeridas.estrategias_diferenciadas && (
                <div className="text-sm leading-relaxed">
                  <EditableText
                    value={guia.adaptaciones_sugeridas.estrategias_diferenciadas}
                    onChange={canEdit ? (v) => updateGuia(['adaptaciones_sugeridas', 'estrategias_diferenciadas'], v) : undefined}
                    disabled={!canEdit}
                    sectionEditing={editingSections['adaptaciones']}
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
                            sectionEditing={editingSections['adaptaciones']}
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
                            sectionEditing={editingSections['adaptaciones']}
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
                            sectionEditing={editingSections['adaptaciones']}
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
