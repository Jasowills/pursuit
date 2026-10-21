import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium transition-colors duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-wait min-h-[44px]',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[#333]',
        secondary: 'bg-[var(--hover)] text-[var(--foreground)] hover:bg-[#e8e8eb]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--hover)]',
        ghost: 'bg-transparent text-[var(--foreground)] hover:bg-[var(--hover)]',
        destructive: 'bg-[var(--danger)] text-white hover:bg-[#991b1b]',
        icon: 'h-10 w-10 min-h-[44px] p-0',
      },
      size: {
        sm: 'h-9 min-h-[36px] px-3 text-sm',
        md: 'h-11 min-h-[44px] px-4 text-sm',
        lg: 'h-12 min-h-[48px] px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

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
