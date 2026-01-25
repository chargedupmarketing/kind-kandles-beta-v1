import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Users, MapPin, CheckCircle, AlertCircle, Construction, Sparkles } from 'lucide-react';
import EventBookingForm from '@/components/EventBookingForm';
import type { Event } from '@/lib/types';

async function getEvent(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/events/${slug}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const event = await getEvent(params.slug);

  if (!event) {
    return {
      title: 'Event Not Found | Kind Kandles & Boutique',
    };
  }

  return {
    title: `${event.title} | Kind Kandles & Boutique`,
    description:
      event.short_description || event.description || 'Join us for this special event',
  };
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

export default async function EventDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const event: Event | null = await getEvent(params.slug);

  if (!event) {
    notFound();
  }

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
              href="/events" 
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Back to Events
            </a>
          </div>
        </div>
      </div>
      {/* Breadcrumb */}
      <div className="bg-gray-50 dark:bg-gray-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <nav className="text-sm">
            <Link
              href="/"
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            >
              Home
            </Link>
            <span className="mx-2 text-gray-400 dark:text-slate-500">/</span>
            <Link
              href="/events"
              className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            >
              Events
            </Link>
            <span className="mx-2 text-gray-400 dark:text-slate-500">/</span>
            <span className="text-gray-900 dark:text-slate-100">{event.title}</span>
          </nav>
        </div>
      </div>

      {/* Event Details */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Event Info */}
            <div>
              {/* Event Image */}
              <div className="aspect-[4/3] bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden mb-6">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 dark:text-slate-500">
                      Event Image
                    </span>
                  </div>
                )}
              </div>

              {/* Event Title & Type */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-sm font-medium rounded-full">
                    {formatEventType(event.event_type)}
                  </span>
                  {event.featured && (
                    <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 text-sm font-medium rounded-full">
                      Featured
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                  {event.title}
                </h1>
                {event.short_description && (
                  <p className="text-xl text-gray-600 dark:text-slate-300">
                    {event.short_description}
                  </p>
                )}
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Clock className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Duration
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-slate-100">
                      {event.duration_minutes} min
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Group Size
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-slate-100">
                      {event.min_participants}-{event.max_participants}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MapPin className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">
                      Location
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-slate-100 text-sm">
                      {formatLocationType(event.location_type)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                    About This Event
                  </h2>
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </div>
              )}

              {/* What's Included */}
              {event.includes && event.includes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                    What's Included
                  </h2>
                  <ul className="space-y-2">
                    {event.includes.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-gray-700 dark:text-slate-300"
                      >
                        <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && event.requirements.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                    Please Note
                  </h2>
                  <ul className="space-y-2">
                    {event.requirements.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-gray-700 dark:text-slate-300"
                      >
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Gallery */}
              {event.gallery_images && event.gallery_images.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {event.gallery_images.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${event.title} gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Form */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <EventBookingForm
                event={event}
                occurrences={event.upcoming_occurrences}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Related Events */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Explore More Events
            </h2>
            <Link href="/events" className="btn-secondary inline-block">
              View All Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
