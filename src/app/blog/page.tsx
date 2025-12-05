import Link from 'next/link';
import Image from 'next/image';

export default function BlogPage() {
  const blogPosts = [
    {
      id: 'the-thoughtful-gift-that-always-wins',
      title: 'The Thoughtful Gift That Always Wins',
      author: 'Kia Wells',
      date: 'March 30, 2025',
      excerpt: 'Candles are like the little black dress of gift-giving—always appropriate, always appreciated. But with so many options, how do you choose the right one?',
      image: '/logos/1.webp',
      href: '/blog/the-thoughtful-gift-that-always-wins'
    },
    {
      id: 'candles-color-psychology',
      title: 'Candles & Color Psychology: How to Design Your Space with Wax & Wick',
      author: 'Kia Wells',
      date: 'March 30, 2025',
      excerpt: 'Color psychology applies to candles too. Studies show that different colors evoke specific emotional responses. Design your space with intention.',
      image: '/logos/2.webp',
      href: '/blog/candles-color-psychology'
    },
    {
      id: 'emotions-are-triggered-by-what',
      title: 'Emotions are triggered by - WHAT?',
      author: 'Kia Wells',
      date: 'March 30, 2025',
      excerpt: 'Studies show that 75% of emotions are triggered by scent. The right fragrance makes your home feel inviting and luxurious.',
      image: '/logos/3.webp',
      href: '/blog/emotions-are-triggered-by-what'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            KKB Blog
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300">
            Insights, tips, and inspiration from the world of candles and self-care
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <Link href={post.href}>
                  <div className="aspect-video relative">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {post.date} • {post.author}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="mt-4">
                      <span className="text-pink-600 dark:text-pink-400 font-medium text-sm hover:underline">
                        Read More →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
