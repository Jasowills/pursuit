import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva('btn disabled:pointer-events-none', {
  variants: {
    variant: {
      primary: 'btn-primary',
      secondary: 'btn-outline',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      destructive: 'btn-danger',
      icon: 'btn-outline h-11 w-11 min-h-[44px] p-0',
    },
    size: {
      sm: 'btn-sm',
      md: '',
      lg: 'text-base',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Set to true while an async action runs; shows spinner + aria-busy. */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
