import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Natural Body Oils - Moisturizing & Nourishing',
  description: 'Luxurious natural body oils crafted with premium ingredients to moisturize, condition, and promote healthy skin. Perfect for massage and daily skincare.',
  keywords: [...SEO_KEYWORDS.bodyOils, 'natural moisturizer', 'skin nourishment', 'massage oil'],
  path: '/collections/body-oils',
});

export default function BodyOilsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

