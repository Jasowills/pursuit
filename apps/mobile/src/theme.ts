/** Native counterpart of the black, ivory and lime product palette. */
export const colors = {
  background: '#080808',
  foreground: '#ededed',
  primary: '#d5f578',
  primaryForeground: '#101010',
  surface: '#111111',
  surfaceRaised: '#141414',
  muted: '#909090',
  mutedForeground: '#b0b0b0',
  border: '#303030',
  hover: '#1c1c1c',
  success: '#85dfad',
  warning: '#f0c675',
  danger: '#f29999',
  successBg: '#12251b',
  successBorder: '#294c38',
  warningBg: '#2b2417',
  warningBorder: '#554527',
  dangerBg: '#301b1b',
  dangerBorder: '#633333',
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
