import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface EditableTextProps {
  value: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function EditableText({
  value,
  onChange,
  multiline = false,
  disabled = false,
  className,
  placeholder = 'Haz clic para editar...'
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled && onChange) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (tempValue !== value && onChange) {
      onChange(tempValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setTempValue(value);
      setIsEditing(false);
    }
  };

  const isEditable = !disabled && onChange;

  if (isEditing) {
    const inputClassName = cn(
      "w-full bg-white border-2 border-amber-400 rounded-md px-3 py-2 text-sm",
      "focus:outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-500",
      "shadow-sm transition-all",
      className
    );

    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={tempValue}
          onChange={(e) => {
            setTempValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(inputClassName, "min-h-[60px] resize-none")}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        placeholder={placeholder}
      />
    );
  }

  if (!isEditable) {
    return (
      <span className={cn("inline-block", !value && "text-muted-foreground italic", className)}>
        {value || placeholder}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            onClick={handleClick}
            className={cn(
              "inline-flex items-center gap-1.5 transition-all rounded-md px-2 py-0.5 -mx-1",
              "border border-dashed border-slate-300 dark:border-slate-600",
              "hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:border-amber-400",
              "cursor-pointer group",
              !value && "text-muted-foreground italic",
              className
            )}
          >
            <span className="flex-1">{value || placeholder}</span>
            <Pencil className="w-3 h-3 text-amber-600 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Haz clic para editar
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
