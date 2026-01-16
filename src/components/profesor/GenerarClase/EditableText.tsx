import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EditableTextProps {
  value: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  sectionEditing?: boolean;
}

export function EditableText({
  value,
  onChange,
  multiline = false,
  disabled = false,
  className,
  placeholder = 'Haz clic para editar...',
  sectionEditing = false
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

  // If not editable, just show plain text
  if (!isEditable) {
    return (
      <span className={cn("inline-block", !value && "text-muted-foreground italic", className)}>
        {value || placeholder}
      </span>
    );
  }

  // Section editing mode: show editable styling when section is being edited
  if (sectionEditing) {
    return (
      <span
        onClick={handleClick}
        className={cn(
          "inline-flex items-center transition-all rounded-md px-2 py-0.5 -mx-1",
          "border border-dashed border-amber-400 bg-amber-50/50 dark:bg-amber-950/30",
          "hover:bg-amber-100 dark:hover:bg-amber-900/40",
          "cursor-pointer",
          !value && "text-muted-foreground italic",
          className
        )}
      >
        <span className="flex-1">{value || placeholder}</span>
      </span>
    );
  }

  // Default: plain text (no border, no pencil icon)
  return (
    <span className={cn("inline-block", !value && "text-muted-foreground italic", className)}>
      {value || placeholder}
    </span>
  );
}
