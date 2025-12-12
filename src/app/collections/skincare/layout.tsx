import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Natural Skincare Products - Body Butter, Soap & More',
  description: 'Shop our handmade natural skincare collection including whipped body butter, foaming body scrub, handmade soap, and luxurious lotions. Crafted with premium natural ingredients.',
  keywords: [...SEO_KEYWORDS.skincare, 'natural beauty', 'organic skincare', 'handmade beauty products'],
  path: '/collections/skincare',
});

export default function SkincareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

