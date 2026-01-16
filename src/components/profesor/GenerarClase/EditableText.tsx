import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Pencil, Check } from 'lucide-react';

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

  if (isEditing) {
    const inputClassName = cn(
      "w-full bg-white border border-primary/30 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
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

  return (
    <span
      onClick={handleClick}
      className={cn(
        "inline-block transition-all rounded px-1 -mx-1",
        !disabled && onChange && "cursor-pointer hover:bg-primary/5 group",
        !value && "text-muted-foreground italic",
        className
      )}
    >
      {value || placeholder}
      {!disabled && onChange && (
        <Pencil className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </span>
  );
}
