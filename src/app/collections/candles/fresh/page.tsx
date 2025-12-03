'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function FreshCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Fresh Candles"
      description="Clean and refreshing scented candles for a crisp, airy atmosphere. Perfect for any room in your home."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="fresh"
    />
  );
}
