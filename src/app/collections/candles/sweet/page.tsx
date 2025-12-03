'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function SweetCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Sweet Candles"
      description="Indulgent dessert-inspired candles with warm, sweet fragrances. Perfect for creating a cozy atmosphere."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="sweet"
    />
  );
}
