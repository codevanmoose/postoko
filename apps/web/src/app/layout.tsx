import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@postoko/auth';
import { SettingsProvider } from '@postoko/settings';
import { BillingProvider } from '@postoko/billing';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Postoko - AI-Powered Perpetual Content Engine',
  description: 'Drop your photo. We'll post it. Daily. The world's first perpetual content engine.',
  keywords: 'social media automation, content scheduling, AI content generation, instagram automation',
  authors: [{ name: 'Van Moose' }],
  creator: 'Van Moose',
  publisher: 'Van Moose',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Postoko - AI-Powered Perpetual Content Engine',
    description: 'Drop your photo. We'll post it. Daily.',
    url: 'https://postoko.com',
    siteName: 'Postoko',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Postoko - AI-Powered Perpetual Content Engine',
    description: 'Drop your photo. We'll post it. Daily.',
    creator: '@postoko',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <BillingProvider>
              {children}
            </BillingProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}