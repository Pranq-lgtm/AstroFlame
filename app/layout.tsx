import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AstroFlameProvider } from '@/frontend/context/astroflame-context';
import AppShell from '@/frontend/components/AppShell';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AstroFlame — SI Microgravity Fire Safety Dashboard',
  description:
    'SI-Powered Microgravity Combustion & Spacecraft Fire Safety Telemetry Dashboard for the 2026 NASA Space Apps Challenge (Flame in Freefall).',
  icons: {
    icon: '/icon.svg',
    apple: '/assets/brand/astroflame-logo.jpg',
  },
  openGraph: {
    title: 'AstroFlame — SI Microgravity Fire Safety Dashboard',
    description:
      'SI-Powered Microgravity Combustion & Spacecraft Fire Safety Telemetry Dashboard for the 2026 NASA Space Apps Challenge (Flame in Freefall).',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AstroFlame — SI Microgravity Fire Safety Dashboard',
    description:
      'SI-Powered Microgravity Combustion & Spacecraft Fire Safety Telemetry Dashboard for the 2026 NASA Space Apps Challenge (Flame in Freefall).',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-dvh overflow-x-hidden overflow-y-auto flex flex-col bg-slate-100 text-slate-900 dark:bg-[#050814] dark:text-slate-100 font-sans antialiased transition-colors duration-200"
      >
        <AstroFlameProvider>
          <AppShell>{children}</AppShell>
        </AstroFlameProvider>
      </body>
    </html>
  );
}
