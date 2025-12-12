'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, Shield, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import Image from 'next/image';

type LoginStep = 'credentials' | '2fa';

export default function AdminLogin() {
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle credential submission
  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requires2FA) {
          // Move to 2FA step
          setUserId(data.userId);
          setMaskedEmail(data.email);
          setOtpExpiresAt(new Date(data.expiresAt));
          setResendCooldown(60);
          setStep('2fa');
          // Focus first OTP input
          setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        } else {
          // Direct login (no 2FA required)
          router.push('/restricted/admin');
        }
      } else {
        setError(data.error || 'Invalid credentials. Access denied.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // Only keep last character
    setOtpCode(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleOtpSubmit(newOtp.join(''));
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtpCode(newOtp);
      handleOtpSubmit(pastedData);
    }
  };

  // Handle OTP keydown (backspace navigation)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP submission
  const handleOtpSubmit = async (code?: string) => {
    const verificationCode = code || otpCode.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, code: verificationCode }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/restricted/admin');
      } else {
        setError(data.error || 'Invalid verification code');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        // Clear OTP on error
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('2FA verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpExpiresAt(new Date(data.expiresAt));
        setResendCooldown(60);
        setRemainingAttempts(3);
        setOtpCode(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
      } else {
        if (data.waitTime) {
          setResendCooldown(data.waitTime);
        }
        setError(data.error || 'Failed to resend code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to credentials step
  const handleBack = () => {
    setStep('credentials');
    setUserId(null);
    setOtpCode(['', '', '', '', '', '']);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-sm sm:max-w-md">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Logo */}
            <div className="mb-4 sm:mb-6">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto">
                <Image
                  src="/logos/logo.png"
                  alt="Kind Kandles"
                  fill
                  className="object-contain rounded-full"
                  priority
                />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              {step === 'credentials' ? 'Admin Login' : 'Verify Identity'}
            </h1>
            <p className="text-slate-400 text-sm sm:text-base px-2">
              {step === 'credentials' 
                ? 'Enter your credentials to continue' 
                : `Code sent to ${maskedEmail}`}
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-5 sm:p-8 border border-slate-700/50">
            {step === 'credentials' ? (
              <form onSubmit={handleCredentialSubmit} className="space-y-4 sm:space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                      placeholder="admin@example.com"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      autoCapitalize="none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5 sm:mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 sm:py-3.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                      placeholder="Enter password"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 p-1"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 sm:py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center text-base sm:text-lg shadow-lg shadow-teal-900/30"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5 sm:space-y-6">
                {/* Back Button */}
                <button
                  onClick={handleBack}
                  className="flex items-center text-slate-400 hover:text-white transition-colors -mt-1"
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  <span className="text-sm">Back</span>
                </button>

                {/* OTP Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3 sm:mb-4 text-center">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        disabled={isLoading}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                </div>

                {/* Remaining Attempts */}
                {remainingAttempts < 3 && (
                  <p className="text-center text-amber-400 text-sm">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </p>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-3">
                    <p className="text-red-300 text-sm text-center">{error}</p>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  onClick={() => handleOtpSubmit()}
                  disabled={isLoading || otpCode.some(d => !d)}
                  className="w-full bg-teal-600 hover:bg-teal-500 active:bg-teal-700 disabled:bg-teal-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 sm:py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center text-base sm:text-lg shadow-lg shadow-teal-900/30"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verify & Login
                    </>
                  )}
                </button>

                {/* Resend Code */}
                <div className="text-center pt-1">
                  <p className="text-slate-400 text-sm mb-2">Didn't receive the code?</p>
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading || resendCooldown > 0}
                    className="text-teal-400 hover:text-teal-300 active:text-teal-500 disabled:text-slate-500 text-sm font-medium inline-flex items-center justify-center py-2 px-3 rounded-lg transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-4 sm:mt-6 px-2">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              🔒 {step === 'credentials' 
                ? 'Secure admin area. All access attempts are logged.'
                : 'Never share your code. We will never ask for it.'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom on mobile */}
      <div className="py-4 sm:py-6">
        <p className="text-slate-600 text-xs text-center">
          © 2024 Kind Kandles Boutique
        </p>
      </div>
    </div>
  );
}
