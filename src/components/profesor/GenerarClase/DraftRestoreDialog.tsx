import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatRelativeTime } from './utils';

interface DraftRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftTimestamp: Date | null;
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftRestoreDialog({
  open,
  onOpenChange,
  draftTimestamp,
  onRestore,
  onDiscard
}: DraftRestoreDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Borrador encontrado</AlertDialogTitle>
          <AlertDialogDescription>
            Encontramos un borrador guardado {draftTimestamp ? formatRelativeTime(draftTimestamp) : 'anteriormente'}.
            ¿Deseas restaurar tu progreso anterior?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Descartar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>
            Restaurar borrador
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
