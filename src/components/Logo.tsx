import { cn } from '@/lib/utils';
import nitiaLogo from '@/assets/nitia-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { img: 'h-6', text: 'text-lg' },
    md: { img: 'h-8', text: 'text-xl' },
    lg: { img: 'h-10', text: 'text-2xl' }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img 
        src={nitiaLogo} 
        alt="Nitia" 
        className={cn(sizes[size].img, 'w-auto')}
      />
    </div>
  );
}
