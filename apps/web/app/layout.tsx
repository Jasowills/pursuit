import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Pursuit — Your next move, already in motion.',
    template: '%s · Pursuit',
  },
  description:
    'Pursuit keeps your job search moving: discover roles, tailor applications, draft outreach — and you approve what gets sent.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
