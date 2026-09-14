import 'boxicons/css/boxicons.min.css';
import './globals.css';
import type { Metadata } from 'next';

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'STUN-FI Skins',
  url: 'https://stunfi.com',
  description:
    'Custom laptop skins, phone skins, and controller wraps with premium precision-cut vinyl finishes.',
  inLanguage: 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://stunfi.com/?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'STUN-FI Skins',
  url: 'https://stunfi.com',
  logo: 'https://stunfi.com/img/stunfi-logo-black.png',
  sameAs: [
    'https://www.instagram.com/stunfihub',
    'https://www.tiktok.com/@stunfihub',
  ],
  description:
    'STUN-FI Skins creates premium precision-cut vinyl wraps for laptops, phones, and controllers.',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://stunfi.com'),
  title: {
    default: 'STUN-FI Skins | Custom Laptop, Phone & Controller Wraps',
    template: '%s | STUN-FI Skins',
  },
  description:
    'STUN-FI Skins creates premium custom laptop skins, phone skins, and controller wraps with precision-cut vinyl finishes, custom artwork, and fast online ordering.',
  keywords: [
    'STUN-FI Skins',
    'stunfi skins',
    'custom laptop skins',
    'custom phone skins',
    'controller wraps',
    'laptop vinyl wraps',
    'phone skins',
    'premium vinyl wraps',
    'custom device wraps',
    'STUN-FI',
  ],
  applicationName: 'STUN-FI Skins',
  authors: [{ name: 'STUN-FI Skins' }],
  openGraph: {
    title: 'STUN-FI Skins | Custom Laptop, Phone & Controller Wraps',
    description:
      'Precision-cut vinyl wraps for laptops, phones, and controllers. Order custom designs, custom text, and premium finishes online.',
    url: 'https://stunfi.com',
    siteName: 'STUN-FI Skins',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://stunfi.com/og-preview.png',
        width: 1200,
        height: 630,
        alt: 'STUN-FI Skins',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'STUN-FI Skins | Custom Laptop, Phone & Controller Wraps',
    description:
      'Premium custom laptop skins, phone skins, and controller wraps from STUN-FI Skins.',
    images: ['https://stunfi.com/og-preview.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
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
