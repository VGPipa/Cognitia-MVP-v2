import { CheckCircle2, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { STEPS } from './constants';
import type { FormSectionProgress } from './types';
import { formatRelativeTime } from './utils';
import { cn } from '@/lib/utils';

interface WizardProgressProps {
  currentStep: number;
  sectionProgress?: FormSectionProgress;
  lastSaved?: Date | null;
  isSaving?: boolean;
}

export function WizardProgress({ 
  currentStep, 
  sectionProgress,
  lastSaved,
  isSaving 
}: WizardProgressProps) {
  const totalSteps = STEPS.length;
  const progress = (currentStep / totalSteps) * 100;

  // Calculate overall step 1 progress from sections
  const step1CompletedFields = sectionProgress
    ? sectionProgress.datos.completed + sectionProgress.propositos.completed + sectionProgress.materiales.completed
    : 0;
  const step1TotalFields = sectionProgress
    ? sectionProgress.datos.total + sectionProgress.propositos.total + sectionProgress.materiales.total
    : 9;

  return (
    <div className="space-y-4">
      {/* Step indicators with section progress */}
      <div className="flex justify-between">
        <TooltipProvider>
          {STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            // Get section-specific info for step 1
            const stepInfo = step.id === 1 && sectionProgress && currentStep === 1
              ? `${step1CompletedFields}/${step1TotalFields} campos`
              : null;
            
            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      "flex items-center gap-2 transition-colors duration-200",
                      isActive && "text-primary",
                      isCompleted && "text-success",
                      !isActive && !isCompleted && "text-muted-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      isActive && "gradient-bg text-primary-foreground scale-110",
                      isCompleted && "bg-success text-success-foreground",
                      !isActive && !isCompleted && "bg-muted"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-sm font-medium">{step.title}</span>
                      {stepInfo && (
                        <span className="text-xs text-muted-foreground">{stepInfo}</span>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{step.title}</p>
                  {step.id === 1 && sectionProgress && (
                    <div className="text-xs mt-1 space-y-0.5">
                      <p className={sectionProgress.datos.isComplete ? 'text-success' : ''}>
                        Datos: {sectionProgress.datos.completed}/{sectionProgress.datos.total}
                      </p>
                      <p className={sectionProgress.propositos.isComplete ? 'text-success' : ''}>
                        Propósitos: {sectionProgress.propositos.completed}/{sectionProgress.propositos.total}
                      </p>
                      <p className={sectionProgress.materiales.isComplete ? 'text-success' : ''}>
                        Materiales: {sectionProgress.materiales.completed}/{sectionProgress.materiales.total}
                      </p>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      
      {/* Progress bar */}
      <Progress value={progress} className="h-2" />

      {/* Auto-save indicator */}
      {(lastSaved || isSaving) && currentStep === 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <Save className={cn("w-3 h-3", isSaving && "animate-pulse")} />
          {isSaving ? (
            <span>Guardando...</span>
          ) : lastSaved ? (
            <span>Guardado {formatRelativeTime(lastSaved)}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
