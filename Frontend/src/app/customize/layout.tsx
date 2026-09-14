import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customize Your STUN-FI Skins Order',
  description:
    'Customize a premium laptop, phone, or controller skin with your own artwork, custom text, finish options, and fast order submission.',
  alternates: {
    canonical: '/customize',
  },
};

export default function CustomizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
