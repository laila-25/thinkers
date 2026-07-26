import { forwardRef, useId } from 'react';

const Input = forwardRef(function Input({ label, hint, error, className = '', id, ...props }, ref) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = `${inputId}-description`;
  return <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">{label && <span className="mb-2 block">{label}</span>}<input ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={hint || error ? descriptionId : undefined} className={`field ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200/60' : ''} ${className}`} {...props}/>{(hint || error) && <span id={descriptionId} className={`mt-1.5 block text-xs ${error ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500'}`}>{error || hint}</span>}</label>;
});

export default Input;
