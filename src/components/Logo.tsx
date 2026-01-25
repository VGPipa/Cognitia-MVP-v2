import { cn } from '@/lib/utils';
import nitiaLogo from '@/assets/nitia-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'h-14',
    md: 'h-24',
    lg: 'h-32'
  };

  return (
    <div className={cn('flex items-center', className)}>
      <img 
        src={nitiaLogo} 
        alt="Nitia" 
        className={cn(sizes[size], 'w-auto object-contain')}
      />
    </div>
  );
}
