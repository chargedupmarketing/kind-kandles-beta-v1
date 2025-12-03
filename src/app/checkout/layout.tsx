import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout - My Kind Kandles & Boutique',
  description: 'Complete your purchase securely',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  );
}

