import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

/*
 * Self-hosted Geist. Both files are the Latin variable subsets, so there is
 * no runtime font request and no build-time network dependency. The licence
 * sits beside the files in app/fonts/OFL.txt.
 */
const geist = localFont({
  src: './fonts/geist-latin.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-geist',
  display: 'swap',
  fallback: ['Inter', 'system-ui', 'sans-serif'],
});

const geistMono = localFont({
  src: './fonts/geist-mono-latin.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-geist-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
});

export const metadata: Metadata = {
  title: {
    default: 'Pursuit — Your next move, already in motion.',
    template: '%s · Pursuit',
  },
  description:
    'Your career, in motion. Pursuit is an open source desktop career harness for job discovery, tailored applications, your own AI models, and a search you control.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
