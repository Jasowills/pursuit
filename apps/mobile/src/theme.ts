/**
 * Design tokens mirrored from @pursuit/ui for React Native (no CSS variables
 * on native). Values must match packages/ui/src/tokens.css exactly.
 */
export const colors = {
  background: '#ffffff',
  foreground: '#111111',
  primary: '#111111',
  primaryForeground: '#ffffff',
  surface: '#fafafa',
  surfaceRaised: '#ffffff',
  muted: '#71717a',
  mutedForeground: '#52525b',
  border: '#e4e4e7',
  hover: '#f4f4f5',
  success: '#15803d',
  warning: '#a16207',
  danger: '#b91c1c',
  successBg: '#effcf3',
  successBorder: '#d3f2de',
  warningBg: '#fdf6ec',
  warningBorder: '#f5e3c2',
  dangerBg: '#fdf3f2',
  dangerBorder: '#f4c7c3',
} as const;

export const radius = { sm: 8, md: 10, lg: 14, xl: 20 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export function statusTone(status: string): { fg: string; bg: string; border: string } {
  if (['SUBMITTED', 'APPROVED', 'QUALIFIED', 'VERIFIED_ELIGIBLE', 'SUCCEEDED'].includes(status)) {
    return { fg: colors.success, bg: colors.successBg, border: colors.successBorder };
  }
  if (['FAILED', 'INELIGIBLE', 'NEEDS_ATTENTION'].includes(status)) {
    return { fg: colors.danger, bg: colors.dangerBg, border: colors.dangerBorder };
  }
  if (['APPLYING', 'NEEDS_VERIFICATION', 'POSSIBLY_ELIGIBLE', 'RUNNING'].includes(status)) {
    return { fg: colors.warning, bg: colors.warningBg, border: colors.warningBorder };
  }
  return { fg: colors.mutedForeground, bg: colors.surface, border: colors.border };
}
