import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Shop All Products - Candles, Skincare & Boutique Items',
  description: 'Browse our complete collection of handmade candles, natural skincare products, body oils, room sprays, and boutique items. Free shipping on orders over $50.',
  keywords: [...SEO_KEYWORDS.general, ...SEO_KEYWORDS.candles, ...SEO_KEYWORDS.skincare, 'shop all'],
  path: '/collections/all',
});

export default function AllProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

