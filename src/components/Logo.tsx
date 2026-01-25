import { cn } from '@/lib/utils';
import nitiaLogo from '@/assets/nitia-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20'
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
