'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BannerContextType {
  isBannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;
  isSimpleBannerVisible: boolean;
  setSimpleBannerVisible: (visible: boolean) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [isBannerVisible, setBannerVisible] = useState(true);
  const [isSimpleBannerVisible, setSimpleBannerVisible] = useState(false); // Start false, will be updated by SimpleBanner

  return (
    <BannerContext.Provider value={{ 
      isBannerVisible, 
      setBannerVisible, 
      isSimpleBannerVisible, 
      setSimpleBannerVisible 
    }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (context === undefined) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}
