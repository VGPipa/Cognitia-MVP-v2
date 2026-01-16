import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookOpen, Sparkles, Calendar, Users } from 'lucide-react';
import type { Clase } from '@/hooks/useClases';
import { formatDate, getEstadoLabel } from './utils';

interface SelectionModeProps {
  isLoading: boolean;
  clases: Clase[];
  grupos: Array<{ id: string; nombre?: string; grado: string; seccion?: string | null } | null>;
  cursosConTemas: Array<{ temas: Array<{ id: string; nombre: string }> }>;
  filtroTema: string;
  filtroGrupo: string;
  onFiltroTemaChange: (value: string) => void;
  onFiltroGrupoChange: (value: string) => void;
  onSeleccionarSesion: (clase: Clase) => void;
  onDescartar: (claseId: string) => void;
  onCrearExtraordinaria: () => void;
}

export function SelectionMode({
  isLoading,
  clases,
  grupos,
  cursosConTemas,
  filtroTema,
  filtroGrupo,
  onFiltroTemaChange,
  onFiltroGrupoChange,
  onSeleccionarSesion,
  onDescartar,
  onCrearExtraordinaria
}: SelectionModeProps) {
  // Computed data
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

  if (isLoading) {
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
        <Card className="border-primary/30 bg-primary/5 animate-scale-in">
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
                  onClick={() => onDescartar(claseEnEdicion.id)}
                >
                  Descartar
                </Button>
                <Button 
                  variant="gradient"
                  onClick={() => onSeleccionarSesion(claseEnEdicion)}
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
          <Select value={filtroTema} onValueChange={onFiltroTemaChange}>
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
          <Select value={filtroGrupo} onValueChange={onFiltroGrupoChange}>
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
        <Card className="border-orange-300 bg-orange-50 animate-slide-up">
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
                onClick={() => onSeleccionarSesion(sesionSugerida)}
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
          {sesionesFiltradas.map((sesion, index) => (
            <Card 
              key={sesion.id} 
              className="hover:border-primary/30 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
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
                    onClick={() => onSeleccionarSesion(sesion)}
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
            <Button variant="outline" onClick={onCrearExtraordinaria}>
              <Sparkles className="w-4 h-4 mr-2" />
              Nueva Clase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
