import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@/components/shared/QueryProvider';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import SessionExpiredHandler from '@/components/shared/SessionExpiredHandler';

export const metadata: Metadata = {
  title: { default: 'LinkSports - India\'s Sports Networking Platform', template: '%s | LinkSports' },
  description: 'India\'s first professional sports networking platform. Connecting athletes, coaches, academies, and sports professionals.',
  keywords: ['sports networking', 'athlete profile', 'sports jobs', 'cricket trials', 'football trials', 'sports academy India'],
  metadataBase: new URL('https://www.linksports.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'LinkSports.in — India\'s Sports Professional Network',
    description: 'Build your free Sports CV. Get discovered by academies, scouts, and clubs across India.',
    url: 'https://www.linksports.in',
    siteName: 'LinkSports',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LinkSports.in — India\'s Sports Professional Network',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LinkSports.in — India\'s Sports Professional Network',
    description: 'Build your free Sports CV. Get discovered by academies, scouts, and clubs across India.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryClientProvider>
          <SessionExpiredHandler />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: '#1f2937', color: '#fff', borderRadius: '8px' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
