'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function NaturalBarSoapPage() {
  return (
    <DynamicCollectionPage
      title="Natural Handmade Bar Soap"
      description="Gentle, natural soaps handcrafted with premium ingredients for daily cleansing. Perfect for all skin types."
      backLink="/collections/skincare"
      backLabel="Back to Skincare"
      productType="Bar Soap"
    />
  );
}
