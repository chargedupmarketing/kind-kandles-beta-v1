'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function BodyOilsPage() {
  return (
    <DynamicCollectionPage
      title="Body Oils"
      description="Nourishing oils crafted with natural ingredients to moisturize, condition, and promote healthy hair and skin."
      backLink="/collections/all"
      backLabel="Back to All Products"
      productType="Body Oil"
    />
  );
}
