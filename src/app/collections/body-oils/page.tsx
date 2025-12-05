'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function BodyOilsPage() {
  return (
    <DynamicCollectionPage
      title="Body Oils"
      description="Nourishing oils crafted with natural ingredients to moisturize, condition, and promote healthy hair and skin."
      backLink="/collections"
      backLabel="Back to Collections"
      productType="Body Oil"
    />
  );
}
