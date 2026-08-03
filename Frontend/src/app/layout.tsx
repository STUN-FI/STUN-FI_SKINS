import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STUN-FI Skins | Ordering Portal',
  description: 'Precision-cut vinyl wraps for laptops, phones, and controllers.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
