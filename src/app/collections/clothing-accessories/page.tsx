'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function ClothingAccessoriesPage() {
  return (
    <DynamicCollectionPage
      title="Clothing & Accessories"
      description="Comfortable and stylish clothing pieces that embody our brand's spirit of kindness and self-care."
      backLink="/collections"
      backLabel="Back to Collections"
      productType="Clothing"
    />
  );
}
