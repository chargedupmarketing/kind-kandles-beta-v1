import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2 } from 'lucide-react';

export default function ColorPsychologyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            March 30, 2025 • Kia Wells
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Candles & Color Psychology: How to Design Your Space with Wax & Wick
          </h1>
        </div>
      </section>

      {/* Featured Image */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src="/logos/2.webp"
              alt="Candles & Color Psychology"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <article className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Candle, Your Mood</h3>
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
              Color psychology applies to candles too. In fact, studies show that different colors evoke specific emotional responses. So, if you're using candles purely for scent, you're missing out on half the magic.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What Each Candle Color Says About You</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900 dark:text-white">White</strong> – Purity, peace, and fresh starts. Perfect for bedrooms and meditation spaces.
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Pink</strong> – Romance, femininity, and self-love. Great for bathrooms and cozy corners.
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Yellow</strong> – Energy, happiness, and creativity. Ideal for home offices and kitchens.
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Blue</strong> – Calm, relaxation, and clarity. Best for bedrooms and reading nooks.
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-4 h-4 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Green</strong> – Balance, nature, and renewal. Works beautifully in living rooms and entryways.
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Mix & Match for the Ultimate Aesthetic</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Interior designers recommend layering candle colors to create depth in a space. Want a sophisticated vibe? Pair white and gold candles. Need a cozy, hygge-inspired setup? Earth tones like beige and terracotta will do the trick.
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Your candle choices aren't just about scent—they're an extension of your style. So next time you're picking one out, ask yourself: <em>What vibe am I setting?</em>
            </p>
          </div>

          {/* Share Section */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600 dark:text-gray-400">Share this article:</span>
                <button className="flex items-center space-x-2 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
              <Link href="/collections" className="btn-primary">
                Shop Our Candles
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
