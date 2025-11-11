import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-pink-400 mb-4">
              My Kind Kandles & Boutique
            </h3>
            <p className="text-gray-300 mb-4">
              Do All Things With Kindness
            </p>
            <div className="text-gray-300">
              <p>9505 Reisterstown Rd</p>
              <p>Suite 2SE</p>
              <p>Owings Mills Maryland 21117</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/collections/candles" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Candles
                </Link>
              </li>
              <li>
                <Link href="/collections/skincare" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Skincare
                </Link>
              </li>
              <li>
                <Link href="/collections/body-oils" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Body Oils
                </Link>
              </li>
              <li>
                <Link href="/collections/room-sprays" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Room Sprays
                </Link>
              </li>
              <li>
                <Link href="/collections/clothing-accessories" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Clothing & Accessories
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about/contact" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about/refund-policy" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/about/mission" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="/customs" className="text-gray-300 hover:text-pink-400 transition-colors">
                  My Kind Customs
                </Link>
              </li>
              <li>
                <Link href="/write-your-story" className="text-gray-300 hover:text-pink-400 transition-colors">
                  Write Your Story
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media & Payment Methods */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Social Media */}
            <div className="flex space-x-4 mb-4 md:mb-0">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-400 transition-colors"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-400 transition-colors"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-400 transition-colors"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-wrap items-center space-x-2 text-sm text-gray-400">
              <span>Payment methods:</span>
              <div className="flex space-x-1 ml-2">
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">Amazon</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">Amex</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">Apple Pay</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">Visa</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">Mastercard</span>
                <span className="bg-gray-700 px-2 py-1 rounded text-xs">PayPal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025, My Kind Kandles & Boutique. Powered by Next.js
          </p>
          <p className="text-gray-500 text-xs mt-2">
            This website was made by a Visionary.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
