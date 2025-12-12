import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS, generateLocalBusinessSchema } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'About Us - Our Story & Values',
  description: 'Learn about My Kind Kandles & Boutique, a family-owned business in Owings Mills, Maryland. Discover our commitment to natural ingredients, handcrafted quality, and kindness.',
  keywords: [...SEO_KEYWORDS.general, 'about us', 'Owings Mills boutique', 'family business', 'handmade products'],
  path: '/about',
});

const localBusinessSchema = generateLocalBusinessSchema();

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={localBusinessSchema} />
      {children}
    </>
  );
}

