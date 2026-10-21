import { ApplicationStatus, GATED_TOOLS, AUTO_TOOLS } from './contracts';
import { ALLOWED_APPLICATION_TRANSITIONS } from './contracts';

export { ALLOWED_APPLICATION_TRANSITIONS };

export function isTransitionAllowed(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return (ALLOWED_APPLICATION_TRANSITIONS[from] as readonly ApplicationStatus[]).includes(to);
}

export function assertTransition(from: ApplicationStatus, to: ApplicationStatus): void {
  if (!isTransitionAllowed(from, to)) {
    throw new Error(`Illegal application transition: ${from} -> ${to}`);
  }
}

/** Tools that must never run automatically (SECURITY_AND_POLICY, locked). */
export function isApprovalGated(tool: string): boolean {
  return (GATED_TOOLS as string[]).includes(tool);
}

export function autoToolNames(): string[] {
  return [...AUTO_TOOLS];
}
