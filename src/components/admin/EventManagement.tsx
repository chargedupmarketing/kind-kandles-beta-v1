'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Archive,
  Copy,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Sparkles
} from 'lucide-react';
import type { Event, EventType, LocationType } from '@/lib/types';

interface EventWithStats extends Event {
  occurrence_count: number;
  booking_count: number;
}

export default function EventManagement() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterLocation, setFilterLocation] = useState<LocationType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventWithStats | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('is_active', filterStatus === 'active' ? 'true' : 'false');
      }
      
      const response = await fetch(`/api/admin/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!event.title.toLowerCase().includes(term) && 
            !event.description?.toLowerCase().includes(term)) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all' && event.event_type !== filterType) {
        return false;
      }

      // Location filter
      if (filterLocation !== 'all' && event.location_type !== filterLocation) {
        return false;
      }

      return true;
    });
  }, [events, searchTerm, filterType, filterLocation]);

  const handleArchive = async (eventId: string) => {
    if (!confirm('Are you sure you want to archive this event?')) return;

    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to archive event');

      alert('Event archived successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error archiving event:', error);
      alert('Failed to archive event');
    }
  };

  const handleDuplicate = async (event: EventWithStats) => {
    if (!confirm(`Duplicate "${event.title}"?`)) return;

    try {
      const newEvent = {
        ...event,
        title: `${event.title} (Copy)`,
        slug: `${event.slug}-copy-${Date.now()}`,
        is_active: false,
      };

      // Remove fields that shouldn't be copied
      delete (newEvent as any).id;
      delete (newEvent as any).created_at;
      delete (newEvent as any).updated_at;
      delete (newEvent as any).occurrence_count;
      delete (newEvent as any).booking_count;
      delete (newEvent as any).next_occurrence;
      delete (newEvent as any).upcoming_occurrences;

      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (!response.ok) throw new Error('Failed to duplicate event');

      alert('Event duplicated successfully');
      fetchEvents();
    } catch (error) {
      console.error('Error duplicating event:', error);
      alert('Failed to duplicate event');
    }
  };

  const formatEventType = (type: EventType) => {
    const map: Record<EventType, string> = {
      workshop: 'Workshop',
      class: 'Class',
      community: 'Community',
      private: 'Private',
      other: 'Other',
    };
    return map[type] || type;
  };

  const formatLocationType = (type: LocationType) => {
    const map: Record<LocationType, string> = {
      mobile: 'Mobile',
      fixed: 'Fixed',
      both: 'Both',
    };
    return map[type] || type;
  };

  const formatPrice = (event: EventWithStats) => {
    if (event.pricing_model === 'custom_quote') return 'Custom Quote';
    if (event.pricing_model === 'per_person' && event.base_price) {
      return `$${event.base_price}/person`;
    }
    if (event.pricing_model === 'flat_rate' && event.base_price) {
      return `$${event.base_price} flat`;
    }
    if (event.pricing_model === 'tiered') return 'Tiered Pricing';
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Event Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage workshops, classes, and events
          </p>
        </div>
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('section', 'event-editor');
            url.searchParams.delete('id');
            window.history.pushState({}, '', url);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="workshop">Workshop</option>
            <option value="class">Class</option>
            <option value="community">Community</option>
            <option value="private">Private</option>
            <option value="other">Other</option>
          </select>

          {/* Location Filter */}
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value as LocationType | 'all')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Locations</option>
            <option value="mobile">Mobile</option>
            <option value="fixed">Fixed</option>
            <option value="both">Both</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            No Events Found
          </h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">
            {searchTerm || filterType !== 'all' || filterLocation !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first event to get started'}
          </p>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('section', 'event-editor');
              url.searchParams.delete('id');
              window.history.pushState({}, '', url);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              {/* Event Image */}
              <div className="aspect-[16/9] bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-gray-700 dark:to-gray-600 relative">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {event.featured && (
                  <div className="absolute top-3 right-3 bg-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Featured
                  </div>
                )}
                {!event.is_active && (
                  <div className="absolute top-3 left-3 bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Inactive
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 text-xs font-medium rounded">
                    {formatEventType(event.event_type)}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs font-medium rounded">
                    {formatLocationType(event.location_type)}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {event.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {event.short_description || event.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Occurrences</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {event.occurrence_count}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Bookings</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {event.booking_count}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Capacity</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {event.max_participants}
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-teal-600 dark:text-teal-400">
                    {formatPrice(event)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {event.duration_minutes} min
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('section', 'event-editor');
                      url.searchParams.set('id', event.id);
                      window.history.pushState({}, '', url);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDuplicate(event)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(event.id)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Archive"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && events.length > 0 && (
        <div className="card p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Events</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {events.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Events</div>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {events.filter(e => e.is_active).length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Occurrences</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {events.reduce((sum, e) => sum + e.occurrence_count, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bookings</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {events.reduce((sum, e) => sum + e.booking_count, 0)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
