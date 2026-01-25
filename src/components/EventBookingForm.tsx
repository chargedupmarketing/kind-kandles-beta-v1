'use client';

import { useState } from 'react';
import { Calendar, MapPin, Users, Send, Loader, CheckCircle } from 'lucide-react';
import type { Event, EventOccurrence, LocationType } from '@/lib/types';

interface EventBookingFormProps {
  event: Event;
  occurrences?: EventOccurrence[];
}

export default function EventBookingForm({ event, occurrences = [] }: EventBookingFormProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    num_participants: event.min_participants,
    occurrence_id: '',
    location_preference: '' as LocationType | '',
    requested_address: '',
    requested_date: '',
    requested_time: '',
    special_requests: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);

  // Calculate price when participants change
  const calculatePrice = (numParticipants: number) => {
    if (event.pricing_model === 'custom_quote') {
      return null;
    }
    if (event.pricing_model === 'per_person' && event.base_price) {
      return event.base_price * numParticipants;
    }
    if (event.pricing_model === 'flat_rate' && event.base_price) {
      return event.base_price;
    }
    if (event.pricing_model === 'tiered' && event.price_tiers) {
      const tier = event.price_tiers.find(
        (t) => numParticipants >= t.min && numParticipants <= t.max
      );
      return tier ? tier.price : null;
    }
    return null;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    // Recalculate price if participants change
    if (name === 'num_participants') {
      const price = calculatePrice(parseInt(value) || event.min_participants);
      setCalculatedPrice(price);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }
    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }
    if (formData.num_participants < event.min_participants) {
      newErrors.num_participants = `Minimum ${event.min_participants} participants required`;
    }
    if (formData.num_participants > event.max_participants) {
      newErrors.num_participants = `Maximum ${event.max_participants} participants allowed`;
    }

    // If no occurrence selected and no custom date, require one
    if (!formData.occurrence_id && !formData.requested_date) {
      newErrors.date = 'Please select a date or request a custom date';
    }

    // If location preference is mobile, require address
    if (formData.location_preference === 'mobile' && !formData.requested_address.trim()) {
      newErrors.requested_address = 'Address is required for mobile events';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/events/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_id: event.id,
          ...formData,
          occurrence_id: formData.occurrence_id || null,
          location_preference: formData.location_preference || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setIsSubmitted(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          num_participants: event.min_participants,
          occurrence_id: '',
          location_preference: '',
          requested_address: '',
          requested_date: '',
          requested_time: '',
          special_requests: '',
        });
        setCalculatedPrice(null);
      }, 5000);
    } catch (error: any) {
      alert(error.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize calculated price
  useState(() => {
    const price = calculatePrice(event.min_participants);
    setCalculatedPrice(price);
  });

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
        Book This Event
      </h2>

      {isSubmitted ? (
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                Booking Request Submitted!
              </h3>
              <p className="text-green-700 dark:text-green-400">
                Thank you! We'll review your request and send you a confirmation email within 24 hours.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customer_name"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    errors.customer_name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.customer_name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.customer_name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="customer_email"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="customer_email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    errors.customer_email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.customer_email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.customer_email}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="customer_phone"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="customer_phone"
                name="customer_phone"
                value={formData.customer_phone}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Number of Participants */}
          <div>
            <label
              htmlFor="num_participants"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
            >
              <Users className="inline h-4 w-4 mr-1" />
              Number of Participants *
            </label>
            <input
              type="number"
              id="num_participants"
              name="num_participants"
              min={event.min_participants}
              max={event.max_participants}
              value={formData.num_participants}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                errors.num_participants
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-300 dark:border-slate-600'
              } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Min: {event.min_participants}, Max: {event.max_participants}
            </p>
            {errors.num_participants && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.num_participants}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
              <Calendar className="inline h-5 w-5 mr-2" />
              Select Date
            </h3>

            {occurrences.length > 0 ? (
              <>
                <label
                  htmlFor="occurrence_id"
                  className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                >
                  Choose from available dates
                </label>
                <select
                  id="occurrence_id"
                  name="occurrence_id"
                  value={formData.occurrence_id}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Select a date...</option>
                  {occurrences.map((occ) => {
                    const startDate = new Date(occ.start_datetime);
                    const spotsLeft =
                      (occ.max_participants || event.max_participants) -
                      occ.current_bookings;
                    return (
                      <option key={occ.id} value={occ.id}>
                        {startDate.toLocaleDateString()} at{' '}
                        {startDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        - {spotsLeft} spots left
                      </option>
                    );
                  })}
                </select>

                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                    Or request a custom date:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="date"
                      name="requested_date"
                      value={formData.requested_date}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <input
                      type="time"
                      name="requested_time"
                      value={formData.requested_time}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="requested_date"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    id="requested_date"
                    name="requested_date"
                    value={formData.requested_date}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.date
                        ? 'border-red-500 dark:border-red-500'
                        : 'border-gray-300 dark:border-slate-600'
                    }`}
                  />
                </div>
                <div>
                  <label
                    htmlFor="requested_time"
                    className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    id="requested_time"
                    name="requested_time"
                    value={formData.requested_time}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
            {errors.date && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.date}
              </p>
            )}
          </div>

          {/* Location Preference */}
          {event.location_type === 'both' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                <MapPin className="inline h-5 w-5 mr-2" />
                Location Preference
              </h3>
              <select
                name="location_preference"
                value={formData.location_preference}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Select location type...</option>
                <option value="mobile">Mobile (We come to you)</option>
                <option value="fixed">At our location</option>
              </select>
            </div>
          )}

          {/* Address for Mobile Events */}
          {(event.location_type === 'mobile' ||
            formData.location_preference === 'mobile') && (
            <div>
              <label
                htmlFor="requested_address"
                className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
              >
                Event Address *
              </label>
              <input
                type="text"
                id="requested_address"
                name="requested_address"
                value={formData.requested_address}
                onChange={handleInputChange}
                disabled={isSubmitting}
                placeholder="Enter full address where event should be held"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.requested_address
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
              />
              {errors.requested_address && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.requested_address}
                </p>
              )}
            </div>
          )}

          {/* Special Requests */}
          <div>
            <label
              htmlFor="special_requests"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
            >
              Special Requests or Questions
            </label>
            <textarea
              id="special_requests"
              name="special_requests"
              rows={4}
              value={formData.special_requests}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Any special requirements, dietary restrictions, or questions..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Price Display */}
          {calculatedPrice !== null && (
            <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-teal-800 dark:text-teal-300">
                  Estimated Total:
                </span>
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  ${calculatedPrice.toFixed(2)}
                </span>
              </div>
              {event.deposit_required && event.deposit_amount && (
                <p className="text-sm text-teal-700 dark:text-teal-400 mt-2">
                  Deposit required: ${event.deposit_amount.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {event.pricing_model === 'custom_quote' && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Custom Pricing:</strong> We'll provide a personalized
                quote based on your requirements.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full btn-primary flex items-center justify-center space-x-2 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Submitting Request...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit Booking Request</span>
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
            By submitting this form, you agree to our terms and conditions. We'll
            contact you within 24 hours to confirm your booking.
          </p>
        </form>
      )}
    </div>
  );
}
