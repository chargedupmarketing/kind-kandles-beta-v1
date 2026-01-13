import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Share2 } from 'lucide-react';

export default function EmotionsTriggeredPage() {
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
            Emotions are triggered by - WHAT?
          </h1>
        </div>
      </section>

      {/* Featured Image */}
      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src="/logos/3.webp"
              alt="Emotions are triggered by - WHAT?"
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
              There's a reason luxury hotels smell divine—it's called <strong>olfactory branding</strong>. Studies show that <strong>75% of emotions are triggered by scent</strong>, meaning the right fragrance makes your home feel inviting and memorable.
            </p>

            <p className="text-gray-700 dark:text-gray-300 mb-8">
              But how do you find your signature home scent? It's all about matching your <strong>personality</strong> with the right fragrance notes. If you love the clean-girl aesthetic, try <strong>Cotton & Cashmere</strong>. If you're a bohemian goddess, <strong>Sandalwood & Myrrh</strong> is your spiritual match.
            </p>

            <div className="bg-pink-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">💡</div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fun Fact:</h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    People are <strong>80% more likely</strong> to remember a place because of its scent than its visuals. That means your candle choice is just as important as your decor!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Your Signature Scent</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your home's fragrance should tell your story. Whether you prefer fresh and clean or warm and cozy, the right candle becomes part of your personal brand.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Remember: scent is the fastest way to the heart and memory. Choose wisely, and your guests will never forget the feeling your home gives them.
              </p>
            </div>
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
