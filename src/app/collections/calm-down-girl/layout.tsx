import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Calm Down Girl Collection - Relaxation & Self-Care',
  description: 'Discover our Calm Down Girl collection featuring soothing products designed for relaxation and self-care. Perfect for unwinding after a long day.',
  keywords: [...SEO_KEYWORDS.general, 'relaxation products', 'self-care', 'stress relief', 'calming'],
  path: '/collections/calm-down-girl',
});

export default function CalmDownGirlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

