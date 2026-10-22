import type { SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'briefcase'
  | 'layers'
  | 'sparkles'
  | 'send'
  | 'folder'
  | 'bell'
  | 'settings'
  | 'search'
  | 'check'
  | 'shield'
  | 'lock'
  | 'file'
  | 'clock'
  | 'globe'
  | 'menu'
  | 'close'
  | 'chevronDown'
  | 'arrowUpRight'
  | 'plus'
  | 'phone'
  | 'monitor'
  | 'command'
  | 'user'
  | 'calendar'
  | 'pause';

const PATHS: Record<IconName, React.ReactNode> = {
  home: (
    <>
      <path d="M3.5 10.2 12 3.5l8.5 6.7" />
      <path d="M5.8 9.1v10.1h12.4V9.1" />
      <path d="M9.5 19.2v-6h5v6" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3.2" y="7.4" width="17.6" height="12.4" rx="2.2" />
      <path d="M8.5 7.2V5.4A1.9 1.9 0 0 1 10.4 3.5h3.2a1.9 1.9 0 0 1 1.9 1.9v1.8M3.4 12.3h17.2" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3.8 8.2 4.4L12 12.6 3.8 8.2 12 3.8Z" />
      <path d="m4.2 12.2 7.8 4.2 7.8-4.2M4.2 15.9l7.8 4.2 7.8-4.2" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.2 13.4 8 18 9.5 13.4 11 12 15.8 10.6 11 6 9.5 10.6 8 12 3.2Z" />
      <path d="m18.7 14.2.6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1Z" />
      <path d="m5.3 13.4.5 1.6 1.6.5-1.6.5-.5 1.6-.5-1.6-1.6-.5 1.6-.5.5-1.6Z" />
    </>
  ),
  send: (
    <>
      <path d="m20.3 3.8-8.1 16.4-1.9-6.4-6.4-1.9 16.4-8.1Z" />
      <path d="m10.3 13.8 4.4-4.4" />
    </>
  ),
  folder: (
    <>
      <path d="M3.4 6.2A1.9 1.9 0 0 1 5.3 4.3h4l2.1 2.4h7.3a1.9 1.9 0 0 1 1.9 1.9v9.5a1.9 1.9 0 0 1-1.9 1.9H5.3a1.9 1.9 0 0 1-1.9-1.9V6.2Z" />
      <path d="M3.7 9.2h16.6" />
    </>
  ),
  bell: (
    <>
      <path d="M6.4 9.4a5.6 5.6 0 0 1 11.2 0c0 5 2 6 2 6H4.4s2-1 2-6Z" />
      <path d="M9.7 18.7a2.5 2.5 0 0 0 4.6 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.4 2.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3.4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.4-2.4.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3.9v-3.4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.4-2.4.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h3.4v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.4 2.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v3.4h-.2a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.5 15.5 4.2 4.2" />
    </>
  ),
  check: <path d="m4.5 12.2 4.6 4.6 10.4-10.4" />,
  shield: (
    <>
      <path d="M12 3.2 19 6v5.5c0 4.3-2.9 7.4-7 9.3-4.1-1.9-7-5-7-9.3V6l7-2.8Z" />
      <path d="m8.7 11.9 2.2 2.2 4.5-4.5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10.2" width="14.4" height="10.2" rx="2.2" />
      <path d="M8.2 10V7.5a3.8 3.8 0 0 1 7.6 0V10M12 14.1v2.4" />
    </>
  ),
  file: (
    <>
      <path d="M6 3.7h7.2l4.8 4.8v11.8H6V3.7Z" />
      <path d="M13.2 3.8v4.8h4.7M8.8 12h6.4M8.8 15.3h6.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.5v5l3.1 2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.7 12h16.6M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.2-3.4-8.5S9.8 5.8 12 3.5Z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6.5 9 5.5 5.5L17.5 9" />,
  arrowUpRight: <path d="M7 17 17 7M8.5 7H17v8.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  phone: (
    <>
      <rect x="7.2" y="2.8" width="9.6" height="18.4" rx="2.4" />
      <path d="M10.5 5.2h3M11.2 18.4h1.6" />
    </>
  ),
  monitor: (
    <>
      <rect x="3.2" y="4.2" width="17.6" height="12.2" rx="2.2" />
      <path d="M8.2 20h7.6M12 16.4V20" />
    </>
  ),
  command: (
    <>
      <path d="M9 9h6v6H9V9Z" />
      <path d="M9 9V7a2 2 0 1 0-2 2h2Zm6 0h2a2 2 0 1 0-2-2v2Zm0 6v2a2 2 0 1 0 2-2h-2Zm-6 0H7a2 2 0 1 0 2 2v-2Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.4 20.2c.7-3.4 3.2-5.3 6.6-5.3s5.9 1.9 6.6 5.3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.8" y="5.2" width="16.4" height="15" rx="2.2" />
      <path d="M7.5 3.5v3.4M16.5 3.5v3.4M3.9 9.5h16.2" />
    </>
  ),
  pause: (
    <>
      <rect x="6.2" y="4.2" width="3.6" height="15.6" rx="1" />
      <rect x="14.2" y="4.2" width="3.6" height="15.6" rx="1" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.7,
  ...props
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      aria-hidden
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
