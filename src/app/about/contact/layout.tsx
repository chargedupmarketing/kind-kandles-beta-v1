import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS, generateLocalBusinessSchema } from '@/lib/seo';
import JsonLd from '@/components/JsonLd';

export const metadata: Metadata = generatePageMetadata({
  title: 'Contact Us - Get in Touch',
  description: 'Contact My Kind Kandles & Boutique in Owings Mills, Maryland. Visit our store at 9505 Reisterstown Rd, Suite 2SE or reach out for custom orders and inquiries.',
  keywords: [...SEO_KEYWORDS.general, 'contact us', 'Owings Mills', 'store location', 'customer service'],
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

