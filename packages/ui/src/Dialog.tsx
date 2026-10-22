import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from './Button';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  title,
  description,
  children,
  closeLabel = 'Close',
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  closeLabel?: string;
  footer?: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--ink)_55%,transparent)] transition-opacity duration-150" />
      <DialogPrimitive.Content className="panel fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(600px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-[var(--ink)] outline-none">
        <DialogPrimitive.Title className="panel-heading">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1 text-sm text-[color:var(--muted)]">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-2 border-t border-[var(--border)] pt-4">
          {footer}
          <DialogPrimitive.Close asChild>
            <Button variant="ghost">{closeLabel}</Button>
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
