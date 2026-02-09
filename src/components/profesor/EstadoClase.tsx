import { CheckCircle2, XCircle, FileText } from 'lucide-react';

interface EstadoClaseProps {
  tieneGuia: boolean;
  className?: string;
}

export const EstadoClase = ({ tieneGuia, className = '' }: EstadoClaseProps) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5">
        {tieneGuia ? (
          <CheckCircle2 className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Guía
        </span>
      </div>
    </div>
  );
};
