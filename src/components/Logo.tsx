import { cn } from '@/lib/utils';
import nitiaLogo from '@/assets/nitia-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'w-56 h-16',
    md: 'w-72 h-20',
    lg: 'w-96 h-24'
  };

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src={nitiaLogo} 
        alt="Nitia" 
        className={cn(sizes[size], 'object-contain')}
      />
    </div>
  );
}
