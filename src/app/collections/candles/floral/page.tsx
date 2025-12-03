'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function FloralCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Floral Candles"
      description="Elegant and romantic floral scented candles. Featuring lavender, rose, jasmine, and beautiful botanical blends."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="floral"
    />
  );
}
