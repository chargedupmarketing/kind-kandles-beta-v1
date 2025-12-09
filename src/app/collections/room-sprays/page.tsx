'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function RoomSpraysPage() {
  return (
    <DynamicCollectionPage
      title="Room Sprays"
      description="Transform your space instantly with our premium room sprays, crafted with natural essential oils for a refreshing ambiance."
      backLink="/collections"
      backLabel="Back to Collections"
      productType="ROOM SPRAY"
    />
  );
}
