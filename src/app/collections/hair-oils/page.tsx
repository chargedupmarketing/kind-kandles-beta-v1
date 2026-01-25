'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function HairOilsPage() {
  return (
    <DynamicCollectionPage
      title="Hair Oils"
      description="Nourish and strengthen your hair with our luxurious hair oils. Made with natural ingredients to promote healthy, shiny hair."
      backLink="/collections/body-oils"
      backLabel="Back to Body Oils"
      productType="Hair Oil"
    />
  );
}
