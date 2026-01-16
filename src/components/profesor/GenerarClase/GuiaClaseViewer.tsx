import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Lightbulb } from 'lucide-react';
import type { GuiaClaseData } from '@/lib/ai/generate';

interface GuiaClaseViewerProps {
  guia: GuiaClaseData;
  duracion?: number;
  isLoaded?: boolean;
}

export function GuiaClaseViewer({ guia, duracion, isLoaded = false }: GuiaClaseViewerProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Success Banner */}
      <div className="p-4 rounded-lg bg-success/10 border border-success/20">
        <div className="flex items-center gap-2 text-success">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium">{isLoaded ? 'Guía de clase cargada' : 'Guía generada exitosamente'}</span>
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
              <p className="font-semibold text-lg">{guia.datos_generales.titulo_sesion}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">ÁREA</span>
              <p className="font-medium">{guia.datos_generales.area_academica}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">GRADO Y SECCIÓN</span>
              <p className="font-medium">{guia.datos_generales.nivel} - {guia.datos_generales.grado}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">DURACIÓN</span>
              <p className="font-medium">{guia.datos_generales.duracion || `${duracion} minutos`}</p>
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
              {guia.propositos_aprendizaje.map((prop, i) => (
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
              {guia.enfoques_transversales.map((enfoque, i) => (
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
            <p className="text-sm leading-relaxed">{guia.preparacion.antes_sesion}</p>
          </div>
          <div className="p-4">
            <h4 className="font-semibold text-sky-700 mb-3">¿Qué recursos o materiales se utilizarán?</h4>
            <ul className="space-y-2">
              {guia.preparacion.materiales.map((mat, i) => (
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
          {guia.momentos_sesion.map((fase, i) => {
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
      {guia.adaptaciones_sugeridas && (
        <div className="border-2 border-rose-400 rounded-lg overflow-hidden">
          <div className="bg-rose-500 text-white px-4 py-2 font-bold flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            ADAPTACIONES SUGERIDAS (NEE)
          </div>
          <div className="p-4 bg-rose-50/30">
            <p className="text-sm leading-relaxed">{guia.adaptaciones_sugeridas.estrategias_diferenciadas}</p>
          </div>
        </div>
      )}
    </div>
  );
}
