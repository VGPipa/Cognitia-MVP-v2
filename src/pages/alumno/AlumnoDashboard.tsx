import { useAuth } from '@/contexts/AuthContext';
import { useAlumno } from '@/hooks/useAlumno';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  TrendingUp,
  Star,
  Loader2
} from 'lucide-react';

export default function AlumnoDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { alumno, isLoading } = useAlumno();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const nombreAlumno = alumno?.nombre || user?.email?.split('@')[0] || 'Estudiante';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">¡Hola, {nombreAlumno}!</h1>
        <p className="text-muted-foreground">
          Sigue aprendiendo y mejorando cada día
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Grado"
          value={alumno?.grado || '-'}
          icon={BookOpen}
        />
        <StatCard
          title="Sección"
          value={alumno?.seccion || '-'}
          icon={Star}
        />
        <StatCard
          title="Progreso"
          value="Ver detalles"
          icon={TrendingUp}
          variant="gradient"
        />
      </div>

      {/* Welcome card */}
      <Card className="gradient-bg text-primary-foreground">
        <CardContent className="p-8 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="font-bold text-lg mb-2">¡Bienvenido a tu espacio de aprendizaje!</h3>
          <p className="text-sm opacity-90 mb-4">
            Revisa tu progreso y sigue avanzando en tus cursos.
          </p>
          <Button 
            variant="secondary" 
            size="sm" 
            className="text-primary"
            onClick={() => navigate('/alumno/progreso')}
          >
            Ver mi progreso
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
