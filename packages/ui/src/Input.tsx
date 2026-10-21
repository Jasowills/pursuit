import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './utils';

const baseField =
  'w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-1 disabled:opacity-50 transition-shadow duration-150';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, 'h-11 min-h-[44px]', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseField, 'min-h-[96px] py-2', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Label = ({ children, htmlFor }: { children: string; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
    {children}
  </label>
);

export const FieldHint = ({ children }: { children: string }) => (
  <p className="mt-1 text-xs text-[var(--muted)]">{children}</p>
);

export const FieldError = ({ children }: { children: string }) => (
  <p role="alert" className="mt-1 text-xs font-medium text-[var(--danger)]">
    {children}
  </p>
);
