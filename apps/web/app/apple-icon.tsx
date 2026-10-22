import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#3b32d6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="140" height="140" viewBox="0 0 32 32">
        <path
          d="M8.5 24.2 23.4 9.3"
          fill="none"
          stroke="#fff"
          strokeWidth="2.35"
          strokeLinecap="round"
        />
        <path
          d="M15.2 9.2h8.4v8.4"
          fill="none"
          stroke="#d9f36a"
          strokeWidth="2.35"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="24.2" r="2.15" fill="#d9f36a" />
      </svg>
    </div>,
    size,
  );
}
