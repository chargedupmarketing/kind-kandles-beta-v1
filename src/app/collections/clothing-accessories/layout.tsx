import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Clothing & Accessories - Boutique Items',
  description: 'Shop our curated collection of clothing and accessories. Unique boutique items selected with care to complement your lifestyle.',
  keywords: [...SEO_KEYWORDS.general, 'boutique clothing', 'accessories', 'fashion boutique'],
  path: '/collections/clothing-accessories',
});

export default function ClothingAccessoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

