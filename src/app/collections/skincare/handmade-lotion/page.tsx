'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function HandmadeLotionPage() {
  return (
    <DynamicCollectionPage
      title="Handmade Lotion"
      description="Moisturizing lotions made with natural ingredients to keep your skin soft, smooth, and nourished all day long."
      backLink="/collections/skincare"
      backLabel="Back to Skincare"
      productType="Lotion"
    />
  );
}
