'use client';

import { useState, useRef } from 'react';
import { Star, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'radio' | 'rating' | 'signature';
  label: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  max?: number;
}

interface EventForm {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  form_type: string;
  form_fields: FormField[];
  header_text: string | null;
  footer_text: string | null;
  submit_button_text: string;
  success_message: string;
  primary_color: string;
  logo_url: string | null;
  background_image_url: string | null;
  require_event_code: boolean;
}

interface EventFormSubmissionProps {
  form: EventForm;
}

export default function EventFormSubmission({ form }: EventFormSubmissionProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [eventCode, setEventCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const signatureRefs = useRef<Record<string, SignatureCanvas | null>>({});

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    for (const field of form.form_fields) {
      if (field.required && !formData[field.id]) {
        setError(`Please fill in the required field: ${field.label}`);
        return;
      }

      // Validate signature fields
      if (field.type === 'signature' && field.required) {
        const sigCanvas = signatureRefs.current[field.id];
        if (sigCanvas && sigCanvas.isEmpty()) {
          setError(`Please provide your signature`);
          return;
        }
      }
    }

    // Capture signatures as base64
    const submissionData = { ...formData };
    form.form_fields.forEach(field => {
      if (field.type === 'signature') {
        const sigCanvas = signatureRefs.current[field.id];
        if (sigCanvas && !sigCanvas.isEmpty()) {
          submissionData[field.id] = sigCanvas.toDataURL();
        }
      }
    });

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/event-forms/${form.slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionData,
          eventCode: form.require_event_code ? eventCode : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id={field.id}
              checked={formData[field.id] || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              required={field.required}
              className="mt-1 h-5 w-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <span className="text-sm text-gray-700">
              {field.description || field.label}
            </span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  required={field.required}
                  className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {Array.from({ length: field.max || 5 }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleInputChange(field.id, rating)}
                className="focus:outline-none"
              >
                <Star
                  className={`h-8 w-8 ${
                    (formData[field.id] || 0) >= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-2">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={(ref) => {
                  signatureRefs.current[field.id] = ref;
                }}
                canvasProps={{
                  className: 'w-full h-40',
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => signatureRefs.current[field.id]?.clear()}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear Signature
            </button>
            {field.description && (
              <p className="text-sm text-gray-500">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: form.background_image_url ? 'transparent' : '#f9fafb',
          backgroundImage: form.background_image_url ? `url(${form.background_image_url})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: form.primary_color + '20' }}
          >
            <CheckCircle 
              className="h-10 w-10"
              style={{ color: form.primary_color }}
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Success!
          </h2>
          <p className="text-gray-600">
            {form.success_message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-12 px-4"
      style={{
        backgroundColor: form.background_image_url ? 'transparent' : '#f9fafb',
        backgroundImage: form.background_image_url ? `url(${form.background_image_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div 
            className="p-8 text-white"
            style={{ backgroundColor: form.primary_color }}
          >
            {form.logo_url && (
              <img 
                src={form.logo_url} 
                alt="Logo" 
                className="h-12 mb-4"
              />
            )}
            <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
            {form.header_text && (
              <p className="text-white/90">{form.header_text}</p>
            )}
            {form.description && (
              <p className="text-white/80 text-sm mt-2">{form.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Event Code (if required) */}
            {form.require_event_code && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventCode}
                  onChange={(e) => setEventCode(e.target.value)}
                  placeholder="Enter event code"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Dynamic Fields */}
            {form.form_fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Footer Text */}
            {form.footer_text && (
              <p className="text-sm text-gray-600 border-t pt-4">
                {form.footer_text}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: form.primary_color }}
            >
              {isSubmitting ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                form.submit_button_text
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
