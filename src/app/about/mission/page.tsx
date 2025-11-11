import { Heart, Leaf, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function MissionPage() {
  const missionPoints = [
    {
      icon: <Heart className="h-12 w-12 text-pink-600" />,
      title: 'Inner Peace & Self-Love',
      description: 'Our goal at My Kind Kandles is to help customers discover inner peace, self-love, and relaxation through our carefully crafted products.'
    },
    {
      icon: <Leaf className="h-12 w-12 text-green-600" />,
      title: 'Natural & Environmentally Friendly',
      description: 'We are committed to offering the best product experience through our natural and environmentally friendly products that care for both you and the planet.'
    },
    {
      icon: <Users className="h-12 w-12 text-blue-600" />,
      title: 'Community Support',
      description: 'We believe in the power of community and supporting our neighbors. There are families in need all around us, and even the smallest act of kindness can go a long way.'
    },
    {
      icon: <Sparkles className="h-12 w-12 text-purple-600" />,
      title: 'Spreading Kindness Globally',
      description: 'Our mission is to spread kindness globally by sharing inspirational messages with everyone through our products and community initiatives.'
    }
  ];

  const values = [
    'Quality over quantity in everything we create',
    'Transparency in our ingredients and processes',
    'Supporting local suppliers and artisans when possible',
    'Creating products that promote wellness and self-care',
    'Building lasting relationships with our customers',
    'Continuous learning and improvement in our craft'
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="gradient-bg py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Our Mission
          </h1>
          <p className="text-2xl text-pink-600 dark:text-pink-400 font-semibold mb-8">
            Do All Things With Kindness
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Our goal at My Kind Kandles is to help customers discover inner peace, self-love, and relaxation. We are committed to offering the best product experience through our natural and environmentally friendly products. Our mission is to spread kindness globally by sharing inspirational messages with everyone.
          </p>
        </div>
      </section>

      {/* Community Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Community Call to Action</h2>
            <h3 className="text-2xl font-semibold text-pink-600 dark:text-pink-400 mb-8">Let's Support Our Neighbors Together!</h3>
          </div>
          <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-8 mb-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              At My KindKandles, we believe in the power of community and the incredible impact we can make when we come together. There are families in need all around us, and even the smallest act of kindness can go a long way. We're reaching out to you to help us support those in our neighborhoods who need it most.
            </p>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Here's How You Can Help – For Free:</h4>
              <p className="text-gray-700 dark:text-gray-300">
                We've made it easy for everyone to contribute in meaningful ways without spending a dime. <strong>All you need to do is submit your contact information</strong> below, and we'll connect you with opportunities to lend a helping hand.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Core Principles</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              The fundamental beliefs that guide every decision we make
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {missionPoints.map((point, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  {point.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {point.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">KKB Blog</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Stay connected with our latest insights and inspirational messages
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/blog/the-thoughtful-gift-that-always-wins" className="bg-pink-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
              <div className="aspect-video relative">
                <Image
                  src="/logos/1.webp"
                  alt="The Thoughtful Gift That Always Wins"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">The Thoughtful Gift That Always Wins</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Kia Wells</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Candles are like the little black dress of gift-giving—always appropriate, always appreciated. But with so many options, how do you choose the right one?
                </p>
              </div>
            </Link>
            <Link href="/blog/candles-color-psychology" className="bg-pink-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
              <div className="aspect-video relative">
                <Image
                  src="/logos/2.webp"
                  alt="Candles & Color Psychology"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Candles & Color Psychology</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Kia Wells</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Color psychology applies to candles too. Studies show that different colors evoke specific emotional responses. Design your space with intention.
                </p>
              </div>
            </Link>
            <Link href="/blog/emotions-are-triggered-by-what" className="bg-pink-50 dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
              <div className="aspect-video relative">
                <Image
                  src="/logos/3.webp"
                  alt="Emotions are triggered by - WHAT?"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Emotions are triggered by - WHAT?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Kia Wells</p>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Studies show that 75% of emotions are triggered by scent. The right fragrance makes your home feel inviting and luxurious.
                </p>
              </div>
            </Link>
          </div>
          <div className="text-center mt-8">
            <Link href="/blog" className="btn-primary">
              View All Blog Posts
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Making a Difference</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              How we're working to create positive impact in our community and beyond
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Environmental Care</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Using sustainable packaging, natural ingredients, and eco-friendly practices in our production process.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Community Support</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Supporting local charities, participating in community events, and creating opportunities for local artisans.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Customer Care</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Providing exceptional service, quality products, and creating meaningful connections with every customer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Join Our Mission
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            When you choose My Kind Kandles & Boutique, you're not just buying a product - 
            you're joining a community committed to kindness, quality, and positive impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/collections" className="btn-primary">
              Shop Our Products
            </a>
            <a href="/about/contact" className="btn-secondary">
              Get in Touch
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
