/**
 * Haptic Feedback Utilities
 * Provides haptic feedback for touch interactions where supported
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Check if vibration API is available
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// Vibration patterns for different feedback types (in milliseconds)
const VIBRATION_PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
  selection: 5,
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
 * Heavy feedback - for destructive actions
 */
export function hapticHeavy(): void {
  haptic('heavy');
}

/**
 * Success feedback - for completed actions
 */
export function hapticSuccess(): void {
  haptic('success');
}

/**
 * Warning feedback - for caution alerts
 */
export function hapticWarning(): void {
  haptic('warning');
}

/**
 * Error feedback - for failed actions
 */
export function hapticError(): void {
  haptic('error');
}

/**
 * Selection feedback - for selecting items
 */
export function hapticSelection(): void {
  haptic('selection');
}

/**
 * Check if haptic feedback is available
 */
export function isHapticAvailable(): boolean {
  return canVibrate;
}

export default haptic;

