'use client';

import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage for saved preference
    const savedMode = localStorage.getItem('admin-dark-mode');
    if (savedMode) {
      setIsDarkMode(savedMode === 'dark');
      if (savedMode === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('admin-dark-mode', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('admin-dark-mode', 'light');
      }
      return newMode;
    });
  };

  return { isDarkMode, toggleDarkMode };
}
