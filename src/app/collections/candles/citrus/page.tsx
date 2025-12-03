'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function CitrusCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Citrus Candles"
      description="Bright and zesty citrus scented candles to energize your space. Featuring lemon, orange, grapefruit, and more."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="citrus"
    />
  );
}
