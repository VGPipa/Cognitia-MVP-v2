import { CheckCircle2, FileCheck } from 'lucide-react';
import type { GuiaClaseData } from '@/lib/ai/generate';

interface ValidacionStepProps {
  guiaGenerada: GuiaClaseData | null;
  isClaseCompletada: boolean;
}

export function ValidacionStep({ guiaGenerada, isClaseCompletada }: ValidacionStepProps) {
  const items = [
    { label: 'Contexto de la clase', completed: true },
    { label: 'Guía de clase generada', completed: !!guiaGenerada }
  ];

  if (isClaseCompletada) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Clase Completada</h2>
          <p className="text-muted-foreground mb-6">
            Esta clase ya ha sido completada y validada
          </p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <FileCheck className="w-12 h-12 text-primary mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Validar y Finalizar</h2>
        <p className="text-muted-foreground mb-6">
          Revisa que la guía esté completa
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
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
  );
}
