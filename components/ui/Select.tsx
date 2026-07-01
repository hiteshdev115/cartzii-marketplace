import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="label">{label}</label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('input appearance-none bg-white', error && 'border-red-500', className)}
          aria-invalid={!!error}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="error-text" role="alert">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
