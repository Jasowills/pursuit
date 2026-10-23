import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from './utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('input', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('input', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Label = ({ children, htmlFor }: { children: string; htmlFor?: string }) => (
  <label htmlFor={htmlFor} className="label">
    {children}
  </label>
);

export const FieldHint = ({ children }: { children: string }) => <p className="hint">{children}</p>;

export const FieldError = ({ children }: { children: string }) => (
  <p role="alert" className="mt-1 text-xs font-medium text-[color:var(--danger)]">
    {children}
  </p>
);
