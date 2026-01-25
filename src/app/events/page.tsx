import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, Users, Clock, Sparkles, Construction } from 'lucide-react';
import type { Event } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Events & Workshops | Kind Kandles & Boutique',
  description:
    'Join us for candle making workshops, classes, and special events. Learn to create your own custom candles with expert instruction.',
};

async function getEvents() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

function formatEventType(type: string): string {
  const typeMap: Record<string, string> = {
    workshop: 'Workshop',
    class: 'Class',
    community: 'Community Event',
    private: 'Private Event',
    other: 'Event',
  };
  return typeMap[type] || type;
}

function formatLocationType(type: string): string {
  const typeMap: Record<string, string> = {
    mobile: 'Mobile (We come to you)',
    fixed: 'At our location',
    both: 'Mobile or Fixed Location',
  };
  return typeMap[type] || type;
}

function formatPrice(event: Event): string {
  if (event.pricing_model === 'custom_quote') {
    return 'Contact for pricing';
  }
  if (event.pricing_model === 'per_person' && event.base_price) {
    return `$${event.base_price.toFixed(2)} per person`;
  }
  if (event.pricing_model === 'flat_rate' && event.base_price) {
    return `$${event.base_price.toFixed(2)} flat rate`;
  }
  if (event.pricing_model === 'tiered' && event.price_tiers) {
    const minPrice = Math.min(...event.price_tiers.map((t) => t.price));
    const maxPrice = Math.max(...event.price_tiers.map((t) => t.price));
    return `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
  }
  return 'Contact for pricing';
}

export default async function EventsPage() {
  const events = await getEvents();
  const featuredEvents = events.filter((e: Event) => e.featured);
  const regularEvents = events.filter((e: Event) => !e.featured);

  return (
    <div className="min-h-screen dark:bg-slate-900 relative">
      {/* Under Development Overlay */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center transform animate-fade-in">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                <Construction className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="h-4 w-4 text-amber-800" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🚧 Coming Soon! 🚧
          </h2>

          {/* Message */}
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Our <span className="font-semibold text-teal-600 dark:text-teal-400">Events & Workshops</span> booking system 
            is currently under final development. We're working hard to bring you an amazing experience!
          </p>

          {/* Features Coming */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">What's coming:</p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li className="flex items-center justify-center gap-2">
                <span className="text-teal-500">✓</span> Online booking system
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="text-teal-500">✓</span> Event calendar
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="text-teal-500">✓</span> Workshop scheduling
              </li>
              <li className="flex items-center justify-center gap-2">
                <span className="text-teal-500">✓</span> Instant confirmations
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            In the meantime, reach out to us directly to book an event!
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a 
              href="/about/contact" 
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
            >
              Contact Us
            </a>
            <a 
              href="/" 
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-gray-800 dark:to-gray-700 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16 text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Events & Workshops
          </h1>
          <p className="text-xl text-gray-700 dark:text-slate-300 mb-8">
            Join us for hands-on candle making experiences, creative workshops,
            and community events
          </p>
          <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed">
            Whether you're looking to learn a new skill, celebrate a special
            occasion, or connect with fellow craft enthusiasts, we have the
            perfect experience for you.
          </p>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                Featured Events
              </h2>
              <p className="text-lg text-gray-600 dark:text-slate-300">
                Don't miss these special experiences
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event: Event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group"
                >
                  <div className="card overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Event Image */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center relative overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Sparkles className="h-16 w-16 text-teal-600 dark:text-teal-400" />
                      )}
                      <div className="absolute top-3 right-3 bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Featured
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-xs font-medium rounded">
                          {formatEventType(event.event_type)}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">
                        {event.short_description || event.description}
                      </p>

                      {/* Event Meta */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                          <Clock className="h-4 w-4 mr-2" />
                          {event.duration_minutes} minutes
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                          <Users className="h-4 w-4 mr-2" />
                          {event.min_participants}-{event.max_participants}{' '}
                          participants
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {formatLocationType(event.location_type)}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600">
                        <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                          {formatPrice(event)}
                        </span>
                        {event.next_occurrence && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            Next:{' '}
                            {new Date(
                              event.next_occurrence.start_datetime
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Events */}
      {regularEvents.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                All Events
              </h2>
              <p className="text-lg text-gray-600 dark:text-slate-300">
                Explore our full range of experiences
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularEvents.map((event: Event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group"
                >
                  <div className="card overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Event Image */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center relative overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Sparkles className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs font-medium rounded">
                          {formatEventType(event.event_type)}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {event.title}
                      </h3>

                      <p className="text-gray-600 dark:text-slate-300 text-sm mb-4 line-clamp-2">
                        {event.short_description || event.description}
                      </p>

                      {/* Event Meta */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                          <Clock className="h-4 w-4 mr-2" />
                          {event.duration_minutes} minutes
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                          <Users className="h-4 w-4 mr-2" />
                          {event.min_participants}-{event.max_participants}{' '}
                          participants
                        </div>
                        <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                          <MapPin className="h-4 w-4 mr-2" />
                          {formatLocationType(event.location_type)}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-600">
                        <span className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                          {formatPrice(event)}
                        </span>
                        {event.next_occurrence && (
                          <div className="flex items-center text-xs text-gray-500 dark:text-slate-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            Next:{' '}
                            {new Date(
                              event.next_occurrence.start_datetime
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <Calendar className="h-16 w-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-600 dark:text-slate-400 mb-2">
              No Events Available Yet
            </h3>
            <p className="text-gray-500 dark:text-slate-500 mb-6">
              We're working on scheduling new events. Check back soon or contact
              us to request a private event!
            </p>
            <Link href="/about/contact" className="btn-primary inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-lg text-gray-700 dark:text-slate-300 mb-8">
            We offer custom events and private workshops for groups, corporate
            team building, parties, and special occasions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/customs" className="btn-primary">
              Request Custom Event
            </Link>
            <Link href="/about/contact" className="btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
