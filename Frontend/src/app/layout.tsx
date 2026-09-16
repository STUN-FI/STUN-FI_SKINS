import 'boxicons/css/boxicons.min.css';
import './globals.css';
import type { Metadata } from 'next';

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'STUN-FI Skins',
  url: 'https://skins.stunfihub.com',
  description:
    'Custom laptop skins, phone skins, and controller wraps with premium precision-cut vinyl finishes.',
  inLanguage: 'en-US',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'STUN-FI Skins',
  url: 'https://skins.stunfihub.com',
  logo: 'https://skins.stunfihub.com/img/stunfi-logo-black.png',
  sameAs: [
    'https://www.instagram.com/stunfihub',
    'https://www.tiktok.com/@stunfihub',
  ],
  description:
    'STUN-FI Skins creates premium precision-cut vinyl wraps for laptops, phones, and controllers.',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://skins.stunfihub.com'),
  title: {
    default: 'Custom Laptop Skins, Phone Skins & Controller Wraps | STUN-FI Skins',
    template: '%s | STUN-FI Skins',
  },
  description:
    'Buy custom laptop skins, laptop skin wraps, phone skins, and controller wraps from STUN-FI Skins. Premium vinyl skin designs for laptops, phones, and controllers.',
  keywords: [
    'STUN-FI Skins',
    'stunfi skins',
    'custom laptop skins',
    'custom laptop skin',
    'laptop skin',
    'laptop skins',
    'phone skin',
    'phone skins',
    'custom phone skins',
    'controller wraps',
    'controller skin',
    'laptop vinyl wraps',
    'premium vinyl wraps',
    'custom device wraps',
    'STUN-FI',
  ],
  applicationName: 'STUN-FI Skins',
  authors: [{ name: 'STUN-FI Skins' }],
  openGraph: {
    title: 'Custom Laptop Skins, Phone Skins & Controller Wraps | STUN-FI Skins',
    description:
      'Precision-cut laptop skin wraps, phone skins, and controller wraps for custom designs, text, and premium finishes.',
    url: 'https://skins.stunfihub.com',
    siteName: 'STUN-FI Skins',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://skins.stunfihub.com/og-preview.png',
        width: 1200,
        height: 630,
        alt: 'STUN-FI Skins',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom Laptop Skins, Phone Skins & Controller Wraps | STUN-FI Skins',
    description:
      'Premium custom laptop skin wraps, phone skins, and controller wraps from STUN-FI Skins.',
    images: ['https://skins.stunfihub.com/og-preview.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([websiteSchema, organizationSchema]),
          }}
        />
        {children}
      </body>
    </html>
  );
}
