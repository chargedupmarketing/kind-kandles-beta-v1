'use client';

import DynamicCollectionPage from '@/components/DynamicCollectionPage';

export default function WoodsyCandlesPage() {
  return (
    <DynamicCollectionPage
      title="Woodsy Candles"
      description="Rich, earthy candles with warm wood notes. Featuring cedar, sandalwood, mahogany, and forest-inspired scents."
      backLink="/collections/candles"
      backLabel="Back to Candles"
      tag="woodsy"
    />
  );
}
