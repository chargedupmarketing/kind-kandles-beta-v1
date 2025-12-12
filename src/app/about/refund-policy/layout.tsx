import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Refund Policy - Returns & Exchanges',
  description: 'Read our customer-friendly refund and return policy. Learn about exchanges, returns, and our satisfaction guarantee at My Kind Kandles & Boutique.',
  keywords: ['refund policy', 'returns', 'exchanges', 'satisfaction guarantee'],
  path: '/about/refund-policy',
});

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

