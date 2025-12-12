import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS, generateLocalBusinessSchema } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Us - Get in Touch',
  description: 'Contact My Kind Kandles & Boutique in Maryland. Reach out for custom orders, inquiries, or to learn more about our handcrafted products.',
  keywords: [...SEO_KEYWORDS.general, 'contact us', 'Maryland', 'customer service', 'custom orders'],
  path: '/about/contact',
});

const localBusinessSchema = generateLocalBusinessSchema();

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={localBusinessSchema} />
      {children}
    </>
  );
}

