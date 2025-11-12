'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: Date;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'compact' | 'banner';
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = memo(({ 
  endTime, 
  title = "Limited Time Offer", 
  subtitle = "Don't miss out on this special deal!",
  variant = 'default',
  onExpire 
}: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date().getTime();
    const end = endTime.getTime();
    const difference = end - now;

    if (difference > 0) {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setIsExpired(true);
      onExpire?.();
    }
  }, [endTime, onExpire]);

  // Ensure component is mounted before calculating time
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [isMounted, calculateTimeLeft]);

  // Don't render until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 sm:p-6 text-center">
        <div className="flex justify-center gap-2 sm:gap-4">
          <div className="text-center">
            <div className="bg-white border-2 border-red-200 rounded-lg p-2 sm:p-3 shadow-md min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl font-bold serif-font text-red-600">00</div>
            </div>
            <div className="text-[10px] sm:text-xs mt-1 font-medium uppercase tracking-wide text-gray-600">Hours</div>
          </div>
          <div className="text-center">
            <div className="bg-white border-2 border-red-200 rounded-lg p-2 sm:p-3 shadow-md min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl font-bold serif-font text-red-600">00</div>
            </div>
            <div className="text-[10px] sm:text-xs mt-1 font-medium uppercase tracking-wide text-gray-600">Minutes</div>
          </div>
          <div className="text-center">
            <div className="bg-white border-2 border-red-200 rounded-lg p-2 sm:p-3 shadow-md min-w-[50px] sm:min-w-[60px]">
              <div className="text-xl sm:text-2xl font-bold serif-font text-red-600">00</div>
            </div>
            <div className="text-[10px] sm:text-xs mt-1 font-medium uppercase tracking-wide text-gray-600">Seconds</div>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600 font-medium">Offer has expired</p>
      </div>
    );
  }

  const TimeUnit = ({ value, label, isBlackFriday }: { value: number; label: string; isBlackFriday?: boolean }) => (
    <div className="text-center">
      <div className={`${isBlackFriday 
        ? 'bg-white border border-teal-200 shadow-lg shadow-teal-100/50' 
        : 'bg-white border-2 border-red-200'
      } rounded-lg p-2 sm:p-3 shadow-md min-w-[50px] sm:min-w-[60px]`}>
        <div className={`text-xl sm:text-2xl font-bold serif-font ${isBlackFriday ? 'text-teal-600' : 'text-red-600'}`}>
          {value.toString().padStart(2, '0')}
        </div>
      </div>
      <div className={`text-[10px] sm:text-xs mt-1 font-medium uppercase tracking-wide ${isBlackFriday ? 'text-gray-600' : 'text-gray-600'}`}>
        {label}
      </div>
    </div>
  );

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
        <Clock className="h-3 w-3 text-white" />
        <span className="text-sm font-medium text-white whitespace-nowrap">
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-sm opacity-90">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-bold text-lg">
              {timeLeft.days > 0 && `${timeLeft.days}d `}
              {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default variant - check if it's Black Friday theme
  const isBlackFriday = title.toLowerCase().includes('black friday');
  
  return (
    <div className={`${isBlackFriday 
      ? 'bg-white border border-gray-200 shadow-2xl shadow-teal-200/50' 
      : 'bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200'
    } rounded-xl p-4 sm:p-6 text-center`}>
      <div className="flex items-center justify-center gap-2 mb-2 sm:mb-3">
        <Clock className={`h-4 w-4 sm:h-5 sm:w-5 animate-pulse ${isBlackFriday ? 'text-teal-600' : 'text-red-600'}`} />
        <h3 className={`serif-font text-base sm:text-xl font-bold ${isBlackFriday ? 'text-gray-800' : 'text-red-700'}`}>{title}</h3>
      </div>
      <p className={`mb-3 sm:mb-4 font-medium text-sm sm:text-base ${isBlackFriday ? 'text-gray-600' : 'text-red-600'}`}>{subtitle}</p>
      
      <div className="flex justify-center gap-2 sm:gap-4">
        {timeLeft.days > 0 && <TimeUnit value={timeLeft.days} label="Days" isBlackFriday={isBlackFriday} />}
        <TimeUnit value={timeLeft.hours} label="Hours" isBlackFriday={isBlackFriday} />
        <TimeUnit value={timeLeft.minutes} label="Minutes" isBlackFriday={isBlackFriday} />
        <TimeUnit value={timeLeft.seconds} label="Seconds" isBlackFriday={isBlackFriday} />
      </div>
    </div>
  );
});

CountdownTimer.displayName = 'CountdownTimer';

export default CountdownTimer;
