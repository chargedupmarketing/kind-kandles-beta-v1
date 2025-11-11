'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShoppingCart, ChevronDown, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useBanner } from '../contexts/BannerContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isBannerVisible, isSimpleBannerVisible } = useBanner();
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  const navigation = [
    { name: 'Home', href: '/' },
    {
      name: 'Products',
      href: '/collections',
      dropdown: [
        {
          name: 'Collections',
          href: '#',
          submenu: [
            { name: 'Everything Calm Down Girl', href: '/collections/calm-down-girl' },
          ]
        },
        {
          name: 'Candles',
          href: '/collections/candles',
          submenu: [
            { name: 'Shop All Candles', href: '/collections/candles/all' },
            { name: 'Citrus', href: '/collections/candles/citrus' },
            { name: 'Fresh', href: '/collections/candles/fresh' },
            { name: 'Floral', href: '/collections/candles/floral' },
            { name: 'Sweet', href: '/collections/candles/sweet' },
            { name: 'Woodsy', href: '/collections/candles/woodsy' },
            { name: 'Herbal', href: '/collections/candles/herbal' },
            { name: 'Earthy', href: '/collections/candles/earthy' },
          ]
        },
        {
          name: 'Skincare',
          href: '/collections/skincare',
          submenu: [
            { name: 'Foaming Body Scrub', href: '/collections/skincare/foaming-body-scrub' },
            { name: 'Body Spray Mist', href: '/collections/skincare/body-spray-mist' },
            { name: 'Handmade Lotion', href: '/collections/skincare/handmade-lotion' },
            { name: 'Whipped Body Butter', href: '/collections/skincare/whipped-body-butter' },
            { name: 'Natural Handmade Bar Soap', href: '/collections/skincare/natural-handmade-bar-soap' },
          ]
        },
        { name: 'Body Oils', href: '/collections/body-oils' },
        { name: 'Room Sprays', href: '/collections/room-sprays' },
        { name: 'Clothing & Accessories', href: '/collections/clothing-accessories' },
        { name: 'My Kind Customs', href: '/customs' },
        { name: 'Shop All Products', href: '/collections' },
      ]
    },
    { name: 'Blog', href: '/blog' },
    { name: 'Write Your Story', href: '/write-your-story' },
    {
      name: 'About Us',
      href: '/about',
      dropdown: [
        { name: 'Refund Policy', href: '/about/refund-policy' },
        { name: 'Our Mission', href: '/about/mission' },
        { name: 'Contact', href: '/about/contact' },
      ]
    },
    { name: 'FAQ', href: '/faq' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    // Add scroll listener to all pages
    window.addEventListener('scroll', handleScroll);
    
    // Set initial scroll state
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic header classes based on scroll state, page, and banner visibility  
  const topPosition = isSimpleBannerVisible ? 'top-8' : 'top-0';
  const headerClasses = isHomepage 
    ? `fixed ${topPosition} left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-teal-500 shadow-lg border-b-8 border-teal-600' 
          : 'bg-transparent'
      }`
    : `sticky ${topPosition} z-40 bg-teal-500 shadow-lg border-b-8 border-teal-600 transition-all duration-300`;

  const textClasses = isHomepage
    ? 'text-white'
    : 'text-white';

  return (
    <header className={headerClasses}>
      <div className="w-full">
        <div className={`flex items-center justify-between ${
          isHomepage 
            ? (isScrolled ? 'h-24 py-3' : 'h-16') 
            : 'h-24 py-3'
        } transition-all duration-300`}>
          {/* Logo + Navigation - Far Left Side */}
          <div className="flex items-center pl-4">
            {/* Logo - Even Bigger */}
            <div className="flex-shrink-0 mr-4">
              <Link href="/" className="flex items-center">
                <img
                  src="/logos/logo.png"
                  alt="My Kind Kandles & Boutique"
                  className="h-24 w-24 object-contain transition-all duration-300"
                  onError={(e) => {
                    console.log('Logo failed to load');
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </Link>
            </div>

            {/* Desktop Navigation - Right next to logo, centered vertically */}
            <nav className="hidden md:flex space-x-6 items-center mt-4">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => {
                  if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    setHoverTimeout(null);
                  }
                  if (item.dropdown) {
                    setActiveDropdown(item.name);
                  }
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setActiveDropdown(null);
                  }, 1000);
                  setHoverTimeout(timeout);
                }}
              >
                <Link
                  href={item.href}
                  className={`${textClasses} hover:text-pink-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] px-3 py-2 text-base font-light flex items-center transition-all duration-300`}
                >
                  {item.name}
                  {item.dropdown && <ChevronDown className="ml-1 h-4 w-4" />}
                </Link>

                {/* Dropdown Menu */}
                {item.dropdown && activeDropdown === item.name && (
                  <div 
                    className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black dark:ring-slate-600 ring-opacity-5 dark:ring-opacity-20 z-50"
                    onMouseEnter={() => {
                      if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        setHoverTimeout(null);
                      }
                      setActiveDropdown(item.name);
                    }}
                    onMouseLeave={() => {
                      const timeout = setTimeout(() => {
                        setActiveDropdown(null);
                      }, 1000);
                      setHoverTimeout(timeout);
                    }}
                  >
                    <div className="py-1">
                      {item.dropdown.map((dropdownItem) => (
                        <div key={dropdownItem.name} className="relative group hover:bg-pink-50 dark:hover:bg-slate-700 transition-colors duration-200">
                          <Link
                            href={dropdownItem.href}
                            className={`block px-4 py-2 text-sm text-gray-700 dark:text-slate-200 hover:bg-pink-50 dark:hover:bg-slate-700 hover:text-pink-600 dark:hover:text-pink-400 ${
                              dropdownItem.submenu ? 'flex items-center justify-between' : ''
                            }`}
                          >
                            {dropdownItem.name}
                            {dropdownItem.submenu && (
                              <ChevronDown className="ml-1 h-3 w-3 rotate-[-90deg]" />
                            )}
                          </Link>
                          {dropdownItem.submenu && (
                            <div className="absolute left-full top-0 -ml-2 pl-3 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black dark:ring-slate-600 ring-opacity-5 dark:ring-opacity-20 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 delay-200">
                              <div className="py-1">
                                {dropdownItem.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    className="block px-4 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-700 hover:text-pink-600 dark:hover:text-pink-400"
                                  >
                                    {subItem.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            </nav>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-4 pr-4">
            <button 
              onClick={toggleDarkMode}
              className={`${textClasses} hover:text-pink-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button className={`${textClasses} hover:text-pink-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] relative transition-all duration-300`}>
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>

            {/* Mobile menu button */}
            <button
              className={`md:hidden ${textClasses} hover:text-pink-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t ${
              isHomepage 
                ? (isScrolled ? 'bg-teal-500' : 'bg-black bg-opacity-20 dark:bg-slate-900 dark:bg-opacity-90')
                : 'bg-teal-500'
            }`}>
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`${textClasses} hover:text-pink-300 block px-3 py-2 text-base font-medium transition-colors duration-300`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.dropdown && (
                    <div className="pl-4">
                      {item.dropdown.map((dropdownItem) => (
                        <div key={dropdownItem.name}>
                          <Link
                            href={dropdownItem.href}
                            className={`${textClasses} opacity-80 hover:text-pink-300 block px-3 py-1 text-sm transition-colors duration-300`}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {dropdownItem.name}
                          </Link>
                          {dropdownItem.submenu && (
                            <div className="pl-4">
                              {dropdownItem.submenu.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  href={subItem.href}
                                  className={`${textClasses} opacity-60 hover:text-pink-300 block px-3 py-1 text-xs transition-colors duration-300`}
                                  onClick={() => setIsMenuOpen(false)}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
