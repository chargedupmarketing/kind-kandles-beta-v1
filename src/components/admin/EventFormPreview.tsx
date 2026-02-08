'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Star, RefreshCw } from 'lucide-react';

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

interface EventFormPreviewProps {
  title: string;
  description?: string;
  headerText?: string;
  footerText?: string;
  formFields: FormField[];
  submitButtonText: string;
  primaryColor: string;
  requireEventCode: boolean;
}

export default function EventFormPreview({
  title,
  description,
  headerText,
  footerText,
  formFields,
  submitButtonText,
  primaryColor,
  requireEventCode,
}: EventFormPreviewProps) {
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({});
  const signatureRefs = useRef<{ [key: string]: SignatureCanvas | null }>({});

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleRatingClick = (fieldId: string, rating: number) => {
    setFormData(prev => ({ ...prev, [fieldId]: rating }));
  };

  const clearSignature = (fieldId: string) => {
    signatureRefs.current[fieldId]?.clear();
    setFormData(prev => ({ ...prev, [fieldId]: null }));
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all"
            style={{ 
              borderColor: value ? primaryColor : undefined 
            }}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 transition-all resize-none"
            style={{ 
              borderColor: value ? primaryColor : undefined 
            }}
          />
        );

      case 'checkbox':
        return (
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleInputChange(field.id, e.target.checked)}
              className="mt-1 rounded transition-all"
              style={{ accentColor: primaryColor }}
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              {field.description || 'I agree'}
            </span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || []).map((option, index) => (
              <label key={index} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name={field.id}
                  checked={value === option}
                  onChange={() => handleInputChange(field.id, option)}
                  className="transition-all"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const maxRating = field.max || 5;
        const currentRating = value || 0;
        const displayRating = hoveredRating[field.id] || currentRating;

        return (
          <div className="flex gap-1">
            {[...Array(maxRating)].map((_, index) => {
              const rating = index + 1;
              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(field.id, rating)}
                  onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [field.id]: rating }))}
                  onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [field.id]: 0 }))}
                  className="transition-all transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 transition-all ${
                      rating <= displayRating
                        ? 'fill-current'
                        : 'fill-none'
                    }`}
                    style={{ 
                      color: rating <= displayRating ? primaryColor : '#d1d5db',
                      stroke: rating <= displayRating ? primaryColor : '#d1d5db'
                    }}
                  />
                </button>
              );
            })}
            {currentRating > 0 && (
              <span className="ml-2 text-sm text-gray-600 self-center">
                {currentRating} / {maxRating}
              </span>
            )}
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-2">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <SignatureCanvas
                ref={(ref) => {
                  if (ref) signatureRefs.current[field.id] = ref;
                  else delete signatureRefs.current[field.id];
                }}
                canvasProps={{
                  className: 'w-full h-40 touch-none',
                  style: { touchAction: 'none' }
                }}
                backgroundColor="white"
                penColor={primaryColor}
                onEnd={() => {
                  const canvas = signatureRefs.current[field.id];
                  if (canvas && !canvas.isEmpty()) {
                    handleInputChange(field.id, canvas.toDataURL());
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => clearSignature(field.id)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Clear signature
            </button>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div 
            className="px-8 py-10 text-white"
            style={{ backgroundColor: primaryColor }}
          >
            <h1 className="text-3xl font-bold mb-2">{title || 'Form Title'}</h1>
            {description && (
              <p className="text-white/90 text-sm">{description}</p>
            )}
          </div>

          {/* Form Content */}
          <div className="px-8 py-8 space-y-6">
            {headerText && (
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{headerText}</p>
              </div>
            )}

            {requireEventCode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Code *
                </label>
                <input
                  type="text"
                  placeholder="Enter event code"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This code will be provided at the event
                </p>
              </div>
            )}

            {formFields.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No fields added yet</p>
                <p className="text-sm">Add fields to see them here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {formFields.map((field) => (
                  <div key={field.id} className="animate-fadeIn">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}

            {footerText && (
              <div className="prose prose-sm max-w-none mt-8 pt-6 border-t border-gray-200">
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{footerText}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              disabled
              className="w-full py-4 rounded-lg text-white font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {submitButtonText || 'Submit'}
            </button>

            <p className="text-xs text-center text-gray-400 mt-4">
              This is a preview - the form is not functional
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
