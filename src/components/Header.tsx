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
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<string[]>([]);
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

  // Toggle mobile menu expansion
  const toggleMobileMenu = (menuName: string) => {
    setExpandedMobileMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  // Close mobile menu and reset expanded menus
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setExpandedMobileMenus([]);
  };

  // Dynamic header classes based on scroll state, page, and banner visibility  
  const topPosition = isSimpleBannerVisible ? 'top-[52px] sm:top-8' : 'top-0';
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

        {/* Mobile Navigation - Sidebar Overlay */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={closeMobileMenu}
            />
            
            {/* Sidebar */}
            <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-50 md:hidden overflow-y-auto transform transition-transform duration-300 ease-in-out">
              {/* Sidebar Header */}
              <div className="sticky top-0 bg-teal-500 dark:bg-teal-600 px-6 py-4 flex items-center justify-between border-b-4 border-teal-600 dark:border-teal-700">
                <h2 className="text-white font-bold text-lg">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="text-white hover:text-pink-300 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="py-4">
                {navigation.map((item) => (
                  <div key={item.name} className="border-b border-gray-200 dark:border-slate-700">
                    {/* Main Menu Item */}
                    {item.dropdown ? (
                      <button
                        onClick={() => toggleMobileMenu(item.name)}
                        className="w-full flex items-center justify-between px-6 py-3 text-gray-900 dark:text-slate-100 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="font-medium">{item.name}</span>
                        <ChevronDown 
                          className={`h-5 w-5 transition-transform duration-200 ${
                            expandedMobileMenus.includes(item.name) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={closeMobileMenu}
                        className="block px-6 py-3 text-gray-900 dark:text-slate-100 hover:bg-pink-50 dark:hover:bg-slate-800 transition-colors font-medium"
                      >
                        {item.name}
                      </Link>
                    )}

                    {/* Dropdown Content */}
                    {item.dropdown && expandedMobileMenus.includes(item.name) && (
                      <div className="bg-gray-50 dark:bg-slate-800">
                        {item.dropdown.map((dropdownItem) => (
                          <div key={dropdownItem.name}>
                            {/* Dropdown Item */}
                            {dropdownItem.submenu ? (
                              <button
                                onClick={() => toggleMobileMenu(`${item.name}-${dropdownItem.name}`)}
                                className="w-full flex items-center justify-between px-8 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                <span>{dropdownItem.name}</span>
                                <ChevronDown 
                                  className={`h-4 w-4 transition-transform duration-200 ${
                                    expandedMobileMenus.includes(`${item.name}-${dropdownItem.name}`) ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            ) : (
                              <Link
                                href={dropdownItem.href}
                                onClick={closeMobileMenu}
                                className="block px-8 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-pink-100 dark:hover:bg-slate-700 transition-colors"
                              >
                                {dropdownItem.name}
                              </Link>
                            )}

                            {/* Submenu Content */}
                            {dropdownItem.submenu && expandedMobileMenus.includes(`${item.name}-${dropdownItem.name}`) && (
                              <div className="bg-gray-100 dark:bg-slate-900">
                                {dropdownItem.submenu.map((subItem) => (
                                  <Link
                                    key={subItem.name}
                                    href={subItem.href}
                                    onClick={closeMobileMenu}
                                    className="block px-12 py-2 text-xs text-gray-600 dark:text-slate-400 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
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
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
