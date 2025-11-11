'use client';

import { useState } from 'react';
import { Settings, Clock, Shield, Eye, EyeOff } from 'lucide-react';

interface MaintenancePageProps {
  message?: string;
  estimatedTime?: string;
  onAccessCodeSubmit: (code: string) => boolean;
}

export default function MaintenancePage({ 
  message = "We are currently performing scheduled maintenance to improve your experience. Please check back shortly!",
  estimatedTime = "2 hours",
  onAccessCodeSubmit 
}: MaintenancePageProps) {
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/maintenance/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ accessCode }),
      });

      const data = await response.json();

      if (response.ok) {
        // Access granted - reload page to bypass maintenance mode
        window.location.reload();
      } else {
        setError(data.error || 'Invalid access code. Please try again.');
        setAccessCode('');
      }
    } catch (error) {
      console.error('Access code verification error:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <Settings className="h-8 w-8 text-orange-600 dark:text-orange-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Kind Kandles Boutique
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Handmade with Love</p>
        </div>

        {/* Maintenance Notice */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">
              🚧 Site Under Maintenance
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Estimated Time */}
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-6 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <Clock className="h-4 w-4" />
            <span>Estimated time: {estimatedTime}</span>
          </div>

          {/* Access Code Section */}
          {!showAccessForm ? (
            <button
              onClick={() => setShowAccessForm(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
            >
              Have an access code? Click here
            </button>
          ) : (
            <div className="border-t border-slate-200 dark:border-slate-600 pt-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Admin Access</span>
              </div>
              
              <form onSubmit={handleSubmitAccessCode} className="space-y-4">
                <div className="relative">
                  <input
                    type={showAccessCode ? 'text' : 'password'}
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-center tracking-wider font-mono pr-10"
                    placeholder="Enter access code"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessCode(!showAccessCode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    disabled={isSubmitting}
                  >
                    {showAccessCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      'Access Site'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccessForm(false);
                      setAccessCode('');
                      setError('');
                    }}
                    className="px-4 py-3 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Thank you for your patience while we improve your experience.
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-2">
            © 2024 Kind Kandles Boutique
          </p>
        </div>
      </div>
    </div>
  );
}
