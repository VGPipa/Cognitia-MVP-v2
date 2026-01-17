import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, Wand2, Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompetenciaSectionProps {
  competenciaId: string;
  competenciaNombre: string;
  capacidades: Array<{ id: string; nombre: string }>;
  selectedCapacidades: string[];
  desempenos: string[];
  isGenerating: boolean;
  isClaseCompletada: boolean;
  onToggleCapacidad: (capacidadId: string) => void;
  onGenerarDesempenos: () => void;
  onUpdateDesempeno: (index: number, value: string) => void;
  onAddDesempeno: () => void;
  onRemoveDesempeno: (index: number) => void;
}

export function CompetenciaSection({
  competenciaId,
  competenciaNombre,
  capacidades,
  selectedCapacidades,
  desempenos,
  isGenerating,
  isClaseCompletada,
  onToggleCapacidad,
  onGenerarDesempenos,
  onUpdateDesempeno,
  onAddDesempeno,
  onRemoveDesempeno
}: CompetenciaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Status indicators
  const hasCapacidades = selectedCapacidades.length > 0;
  const hasDesempenos = desempenos.some(d => d.trim() !== '');
  const isComplete = hasCapacidades && hasDesempenos;
  const needsAttention = !hasCapacidades || !hasDesempenos;

  // Auto-scroll when expanded
  useEffect(() => {
    if (isExpanded && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [isExpanded]);

  return (
    <div 
      ref={sectionRef}
      className={cn(
        "border rounded-lg overflow-hidden transition-all duration-300",
        isComplete ? "border-success/30 bg-success/5" : "border-border bg-muted/20",
        needsAttention && !isComplete && "border-warning/30"
      )}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <GraduationCap className={cn(
            "w-5 h-5",
            isComplete ? "text-success" : "text-primary"
          )} />
          <span className="font-semibold text-left">{competenciaNombre}</span>
          
          {/* Status badges */}
          <div className="flex items-center gap-2">
            {isComplete ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completa
              </Badge>
            ) : (
              <>
                {!hasCapacidades && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                    Sin capacidades
                  </Badge>
                )}
                {hasCapacidades && !hasDesempenos && (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 text-xs">
                    Sin desempeños
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Expandable Content */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 pt-0 space-y-4 animate-fade-in">
          
          {/* Capacidades - Nuevo diseño con Popover */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              Capacidades *
              {!hasCapacidades && (
                <AlertCircle className="w-3 h-3 text-warning" />
              )}
            </Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-background min-h-[48px] items-center">
              {/* Mostrar capacidades seleccionadas */}
              {selectedCapacidades.map(capId => {
                const cap = capacidades.find(c => c.id === capId);
                if (!cap) return null;
                return (
                  <Badge
                    key={capId}
                    variant="default"
                    className="text-xs flex items-center gap-1 pr-1"
                  >
                    <span className="max-w-[200px] truncate">{cap.nombre}</span>
                    {!isClaseCompletada && (
                      <button
                        type="button"
                        onClick={() => onToggleCapacidad(capId)}
                        className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                );
              })}
              
              {/* Botón para agregar capacidades */}
              {!isClaseCompletada && capacidades.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Plus className="w-3 h-3" />
                      Agregar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2" align="start">
                    
                    <ScrollArea className="max-h-[200px]">
                      <div className="space-y-1">
                        {capacidades.filter(cap => !selectedCapacidades.includes(cap.id)).map(cap => (
                          <button
                            key={cap.id}
                            type="button"
                            onClick={() => onToggleCapacidad(cap.id)}
                            className="w-full text-left p-2 text-sm rounded hover:bg-muted transition-colors"
                          >
                            {cap.nombre}
                          </button>
                        ))}
                        {capacidades.filter(cap => !selectedCapacidades.includes(cap.id)).length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">Todas las capacidades ya están seleccionadas</p>
                        )}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              )}
              
              {capacidades.length === 0 && (
                <span className="text-xs text-muted-foreground">No hay capacidades disponibles</span>
              )}
            </div>
          </div>
          
          {/* Desempeños */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                Desempeños *
                {hasCapacidades && !hasDesempenos && (
                  <AlertCircle className="w-3 h-3 text-warning" />
                )}
              </Label>
              
              {!isClaseCompletada && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onGenerarDesempenos}
                  disabled={selectedCapacidades.length === 0 || isGenerating}
                  className="h-6 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3 h-3" />
                      Generar
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {isGenerating ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : desempenos.length > 0 ? (
              <div className="space-y-2">
                {desempenos.map((desemp, idx) => (
                  <div key={idx} className="flex gap-2 animate-fade-in">
                    <span className="text-primary font-bold mt-2">•</span>
                    <Textarea
                      value={desemp}
                      onChange={(e) => onUpdateDesempeno(idx, e.target.value)}
                      placeholder="Describe el desempeño..."
                      rows={2}
                      disabled={isClaseCompletada}
                      className="flex-1 transition-shadow focus:shadow-md"
                    />
                    {!isClaseCompletada && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveDesempeno(idx)}
                        className="text-destructive hover:text-destructive h-8 w-8 mt-1"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg text-center">
                Selecciona capacidades y usa "Generar Desempeños" o agrega manualmente
              </p>
            )}
            
            {!isClaseCompletada && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAddDesempeno}
                className="text-primary text-xs hover:bg-primary/10"
              >
                + Agregar desempeño
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
