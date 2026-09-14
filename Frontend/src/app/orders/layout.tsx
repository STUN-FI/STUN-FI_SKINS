import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STUN-FI Skins Order Search',
  description:
    'Search and view your STUN-FI Skins order history and receipts by phone number or name.',
  alternates: {
    canonical: '/orders',
  },
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
