import Link from 'next/link';
import { Heart, Users, Leaf, Star } from 'lucide-react';
import TrustBadges from '@/components/TrustBadges';

export default function AboutPage() {
  const values = [
    {
      icon: <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />,
      title: 'Kindness First',
      description: 'We believe in doing all things with kindness - from how we treat our customers to how we source our ingredients.'
    },
    {
      icon: <Leaf className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: 'Natural & Sustainable',
      description: 'Our products are made with natural ingredients that are good for you and good for the environment.'
    },
    {
      icon: <Users className="h-8 w-8 text-teal-600 dark:text-teal-400" />,
      title: 'Community Focused',
      description: 'We are proud to be a part of our local community and support meaningful initiatives.'
    },
    {
      icon: <Star className="h-8 w-8 text-amber-600 dark:text-amber-400" />,
      title: 'Quality Craftsmanship',
      description: 'Every product is handmade with attention to detail and a commitment to excellence.'
    }
  ];

  return (
    <div className="min-h-screen dark:bg-slate-900">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700 py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center mb-6">
            <span className="text-6xl flame-flicker">🕯️</span>
          </div>
          <h1 className="serif-font text-5xl md:text-6xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            About My Kind Kandles & Boutique
          </h1>
          <div className="script-font text-3xl text-amber-600 dark:text-amber-400 mb-8">
            ✨ Do All Things With Kindness ✨
          </div>
          <p className="text-xl text-gray-700 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Welcome to My Kind Kandles & Boutique, where we believe that kindness should be at the heart of everything we do. 
            From our handcrafted candles to our natural skincare products, every item is made with love, care, and the finest natural ingredients.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md">
            <span className="text-amber-600 dark:text-amber-400">📍</span>
            <span className="text-gray-700 dark:text-slate-300 font-medium">Proudly serving Maryland & beyond</span>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  My Kind Kandles & Boutique was born from a passion for creating beautiful, natural products that bring joy and wellness into people's lives. 
                  What started as a small dream has grown into a beloved boutique serving customers across Maryland and beyond.
                </p>
                <p>
                  We specialize in handcrafted candles made with premium soy wax and essential oils, luxurious skincare products with natural ingredients, 
                  and carefully curated boutique items. Each product is made with intention, love, and our commitment to kindness.
                </p>
                <p>
                  Based in Maryland, we're more than just a boutique - we're a community hub where kindness, quality, and natural beauty come together.
                </p>
              </div>
            </div>
            <div className="bg-gray-200 aspect-square rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Our Story Image</span>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Connect With Us</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
                  <p className="text-gray-600">
                    Shop our products online, or book a mobile candle making experience 
                    for your next event or gathering.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-600">
                    Based in Maryland, USA
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <Link href="/about/contact" className="btn-primary">
                  Contact Us
                </Link>
              </div>
            </div>
            <div className="bg-gray-200 aspect-[4/3] rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Brand Image</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-pink-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Learn More</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/about/mission" className="card p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Our Mission</h3>
              <p className="text-gray-600 text-sm">
                Discover our commitment to kindness, quality, and natural beauty.
              </p>
            </Link>
            <Link href="/about/contact" className="card p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Us</h3>
              <p className="text-gray-600 text-sm">
                Get in touch with questions, custom orders, or just to say hello.
              </p>
            </Link>
            <Link href="/about/refund-policy" className="card p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Refund Policy</h3>
              <p className="text-gray-600 text-sm">
                Learn about our customer-friendly return and refund policies.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
