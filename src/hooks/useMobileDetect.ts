'use client';

import { useState, useEffect, useCallback } from 'react';

interface MobileDetectResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useMobileDetect(): MobileDetectResult {
  const [state, setState] = useState<MobileDetectResult>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouch: false,
    isPortrait: true,
    isLandscape: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1024,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const updateState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    setState({
      isMobile: width < MOBILE_BREAKPOINT,
      isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
      isDesktop: width >= TABLET_BREAKPOINT,
      isTouch,
      isPortrait: height > width,
      isLandscape: width > height,
      screenWidth: width,
      screenHeight: height,
    });
  }, []);

  useEffect(() => {
    // Initial detection
    updateState();

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateState);
    window.addEventListener('orientationchange', updateState);

    return () => {
      window.removeEventListener('resize', updateState);
      window.removeEventListener('orientationchange', updateState);
    };
  }, [updateState]);

  return state;
}

// Simple hook for just mobile detection (most common use case)
export function useIsMobile(): boolean {
  const { isMobile } = useMobileDetect();
  return isMobile;
}

export default useMobileDetect;

