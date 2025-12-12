import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Custom Orders & Candle Making Experiences',
  description: 'Create your own custom candles or book a candle making experience for parties and events. Perfect for birthdays, bridal showers, and team building in Owings Mills, Maryland.',
  keywords: [...SEO_KEYWORDS.general, 'custom candles', 'candle making party', 'DIY candles', 'private events', 'team building'],
  path: '/customs',
});

export default function CustomsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

