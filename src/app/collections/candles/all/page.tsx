'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function AllCandlesPage() {
  return (
    <DynamicCollectionPage
      title="All Candles"
      description="Explore our complete collection of handcrafted soy candles. Each candle is made with love and premium ingredients."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      productType="Candle"
    />
  );
}
