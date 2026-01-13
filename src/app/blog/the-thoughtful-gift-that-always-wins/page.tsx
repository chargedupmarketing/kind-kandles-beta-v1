import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2 } from 'lucide-react';

export default function ThoughtfulGiftPage() {
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
            The Thoughtful Gift That Always Wins
          </h1>
        </div>
      </section>

      {/* Featured Image */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src="/logos/1.webp"
              alt="The Thoughtful Gift That Always Wins"
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
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
              Candles are like the little black dress of gift-giving—always appropriate, always appreciated. But with so many options, how do you choose the right one? Easy. Let's match the candle to the personality.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For the Homebody</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              A warm, cozy scent like vanilla or amber is perfect for someone who loves being curled up on the couch. Bonus points if it comes in a cute jar that doubles as decor.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For the Zen Seeker</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Lavender and eucalyptus candles are ideal for the friend who starts their day with meditation and ends it with herbal tea.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For the Trendsetter</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Go for something unexpected—maybe a bold scent like tobacco and leather in a sleek, modern vessel.
            </p>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For the Hopeless Romantic</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-8">
              A rose or peony candle is a must-have. Bonus: They double as mood lighting for date night.
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Candles are a personal, luxurious gift that never fails. Just match the scent to the soul, and you'll be known as the best gift-giver in the group.
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
              <Link href="/collections/candles" className="btn-primary">
                Shop Our Candles
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
