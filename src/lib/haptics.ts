/**
 * Haptic Feedback Utilities
 * Provides haptic feedback for touch interactions where supported
 */

type HapticStyle = 'light' | 'medium' | 'success' | 'error';

// Check if vibration API is available
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// Vibration patterns for different feedback types (in milliseconds)
const VIBRATION_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  success: [10, 50, 10],
  error: [30, 100, 30, 100, 30],
};

/**
 * Trigger haptic feedback
 * @param style - The type of haptic feedback
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (!canVibrate) return;

  try {
    const pattern = VIBRATION_PATTERNS[style];
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug('Haptic feedback not available:', error);
  }
}

/**
 * Light tap feedback - for button presses
 */
export function hapticLight(): void {
  haptic('light');
}

/**
 * Medium feedback - for successful actions
 */
export function hapticMedium(): void {
  haptic('medium');
}

/**
 * Success feedback - for completed actions
 */
export function hapticSuccess(): void {
  haptic('success');
}

/**
 * Error feedback - for failed actions
 */
export function hapticError(): void {
  haptic('error');
}

