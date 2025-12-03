'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function EarthyCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Earthy Candles"
      description="Grounding earthy candles with natural, organic scents. Perfect for meditation and creating a peaceful atmosphere."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="earthy"
    />
  );
}
