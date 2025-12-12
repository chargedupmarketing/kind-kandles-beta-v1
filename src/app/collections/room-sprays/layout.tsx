import { Metadata } from 'next';
import { generatePageMetadata, SEO_KEYWORDS } from '@/lib/seo';

export const metadata: Metadata = generatePageMetadata({
  title: 'Natural Room Sprays - Home Fragrance & Air Fresheners',
  description: 'Transform your space with our premium natural room sprays. Made with essential oils for a refreshing, long-lasting fragrance without harsh chemicals.',
  keywords: [...SEO_KEYWORDS.roomSprays, 'home fragrance', 'natural air freshener', 'essential oil spray'],
  path: '/collections/room-sprays',
});

export default function RoomSpraysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

