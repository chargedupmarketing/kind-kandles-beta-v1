'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function HerbalCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Herbal Candles"
      description="Aromatic herbal candles with therapeutic benefits. Featuring eucalyptus, mint, rosemary, and calming botanical blends."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="herbal"
    />
  );
}
