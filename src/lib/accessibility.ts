// Accessibility utilities and helpers
import React from 'react';

export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-modal'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Generate unique IDs for accessibility
let idCounter = 0;
export function generateId(prefix: string = 'id'): string {
  idCounter++;
  return `${prefix}-${idCounter}`;
}

// Screen reader only text utility
export function createSROnlyText(text: string): React.ReactElement {
  return React.createElement('span', { className: 'sr-only' }, text);
}

// Focus management utilities
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Color contrast utilities
export function getContrastRatio(color1: string, color2: string): number {
  // This is a simplified version - in production, use a proper color contrast library
  // Returns a ratio between 1 and 21
  return 4.5; // Placeholder - implement actual contrast calculation
}

export function meetsWCAGContrast(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
  const ratio = getContrastRatio(color1, color2);
  return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
}

// Keyboard navigation helpers
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  HOME: 'Home',
  END: 'End',
} as const;

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  handlers: Partial<Record<keyof typeof KEYBOARD_KEYS, () => void>>
): void {
  const handler = Object.entries(handlers).find(([key]) => 
    KEYBOARD_KEYS[key as keyof typeof KEYBOARD_KEYS] === event.key
  );
  
  if (handler) {
    event.preventDefault();
    handler[1]();
  }
}

// Focus visible utilities
export function addFocusVisiblePolyfill(): void {
  // Add focus-visible polyfill for better keyboard navigation
  if (typeof window !== 'undefined' && !window.CSS?.supports?.('selector(:focus-visible)')) {
    // Dynamically import focus-visible polyfill if available
    // @ts-expect-error - Optional polyfill, may not be installed
    import('focus-visible').catch(() => {
      // Polyfill not installed, skip
    });
  }
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Text size utilities
export function getTextSize(): 'small' | 'medium' | 'large' {
  if (typeof window === 'undefined') return 'medium';
  
  const fontSize = parseInt(window.getComputedStyle(document.documentElement).fontSize);
  
  if (fontSize >= 20) return 'large';
  if (fontSize <= 14) return 'small';
  return 'medium';
}

// Skip link utilities
export function createSkipLink(targetId: string, text: string): React.ReactElement {
  return React.createElement(
    'a',
    {
      href: `#${targetId}`,
      className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg'
    },
    text
  );
}

// Form accessibility helpers
export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
}

export function getFormFieldProps(field: FormFieldProps): AccessibilityProps {
  const props: AccessibilityProps = {
    'aria-required': field.required,
    'aria-invalid': !!field.error,
  };

  if (field.error) {
    props['aria-describedby'] = `${field.id}-error`;
  } else if (field.description) {
    props['aria-describedby'] = `${field.id}-description`;
  }

  return props;
}

// Loading state accessibility
export function createLoadingAnnouncement(isLoading: boolean, loadingText: string = 'Loading'): AccessibilityProps {
  return {
    'aria-live': 'polite',
    'aria-busy': isLoading,
    'aria-label': isLoading ? loadingText : undefined,
  };
}

// Modal accessibility
export interface ModalAccessibilityProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  descriptionId?: string;
}

export function getModalProps(props: ModalAccessibilityProps): AccessibilityProps {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': props.titleId,
    'aria-describedby': props.descriptionId,
    'aria-hidden': !props.isOpen,
  };
}

// Button accessibility
export interface ButtonAccessibilityProps {
  isPressed?: boolean;
  isExpanded?: boolean;
  controls?: string;
  disabled?: boolean;
}

export function getButtonProps(props: ButtonAccessibilityProps): AccessibilityProps {
  return {
    'aria-pressed': props.isPressed,
    'aria-expanded': props.isExpanded,
    'aria-controls': props.controls,
    'aria-disabled': props.disabled,
    tabIndex: props.disabled ? -1 : 0,
  };
}
